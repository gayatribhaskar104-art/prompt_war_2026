import sqlite3

DATABASE = "civicsense.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                summary TEXT NOT NULL,
                location TEXT,
                duration TEXT,
                priority TEXT NOT NULL,
                priority_reason TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'New',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def create_complaint(data):
    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO complaints (
                description,
                category,
                summary,
                location,
                duration,
                priority,
                priority_reason,
                recommended_action
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["description"],
            data["category"],
            data["summary"],
            data["location"],
            data["duration"],
            data["priority"],
            data["priority_reason"],
            data["recommended_action"]
        ))

        return cursor.lastrowid


def get_all_complaints():
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT *
            FROM complaints
            ORDER BY created_at DESC, id DESC
        """).fetchall()

        return [dict(row) for row in rows]


def update_status(complaint_id, status):
    allowed_statuses = {
        "New",
        "Under Review",
        "Assigned",
        "Resolved"
    }

    if status not in allowed_statuses:
        raise ValueError("Invalid complaint status")

    with get_connection() as connection:
        cursor = connection.execute("""
            UPDATE complaints
            SET status = ?
            WHERE id = ?
        """, (status, complaint_id))

        return cursor.rowcount > 0