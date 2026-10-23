from flask import Flask, render_template, request, jsonify
from ai_service import analyze_complaint
from database import (
    initialize_database,
    create_complaint,
    get_all_complaints,
    update_status
)

app = Flask(__name__, static_folder="component")

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024

initialize_database()


def calculate_priority(data):
    """
    Simple, transparent rules-based priority assessment.
    This is a prototype, not an official emergency classification.
    """

    text = (
        data.get("description", "") + " " +
        data.get("summary", "") + " " +
        str(data.get("affected_area") or "")
    ).lower()

    high_risk_terms = [
        "contaminated drinking water",
        "sewage overflow",
        "exposed electrical wire",
        "open manhole",
        "major road collapse"
    ]

    if any(term in text for term in high_risk_terms):
        return (
            "High",
            "A predefined safety-related keyword was detected. "
            "A human reviewer should verify the reported risk."
        )

    if data.get("duration"):
        duration = data["duration"].lower()

        if any(term in duration for term in [
            "week", "weeks", "month", "months"
        ]):
            return (
                "Medium",
                "The complaint reports a potentially prolonged issue."
            )

    return (
        "Normal",
        "No predefined high-risk indicator was detected."
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/complaints", methods=["GET"])
def list_complaints():
    return jsonify(get_all_complaints())


@app.route("/api/complaints", methods=["POST"])
def submit_complaint():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request data."}), 400

    description = payload.get("description")

    if not isinstance(description, str):
        return jsonify({"error": "Please enter a complaint."}), 400

    description = description.strip()

    if len(description) < 10:
        return jsonify({
            "error": "Please provide at least 10 characters."
        }), 400

    if len(description) > 3000:
        return jsonify({
            "error": "Complaint must be 3000 characters or fewer."
        }), 400

    try:
        analysis = analyze_complaint(description)

        complaint_data = {
            **analysis,
            "description": description
        }

        priority, priority_reason = calculate_priority(
            complaint_data
        )

        complaint_data["priority"] = priority
        complaint_data["priority_reason"] = priority_reason

        complaint_id = create_complaint(complaint_data)

        return jsonify({
            "message": "Complaint analyzed and saved.",
            "id": complaint_id,
            **complaint_data,
            "status": "New"
        }), 201

    except Exception:
        app.logger.exception("Complaint processing failed.")

        return jsonify({
            "error": (
                "The complaint could not be processed. "
                "Please try again."
            )
        }), 502


@app.route(
    "/api/complaints/<int:complaint_id>/status",
    methods=["PATCH"]
)
def change_status(complaint_id):
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid request data."}), 400

    status = payload.get("status")

    allowed_statuses = {
        "New",
        "Under Review",
        "Assigned",
        "Resolved"
    }

    if status not in allowed_statuses:
        return jsonify({"error": "Invalid status."}), 400

    try:
        updated = update_status(complaint_id, status)

        if not updated:
            return jsonify({
                "error": "Complaint not found."
            }), 404

        return jsonify({
            "message": "Complaint status updated.",
            "id": complaint_id,
            "status": status
        })

    except Exception:
        app.logger.exception("Status update failed.")

        return jsonify({
            "error": "Could not update complaint status."
        }), 500


if __name__ == "__main__":
    app.run(debug=False)
