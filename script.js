const form = document.getElementById("complaintForm");
const descriptionInput = document.getElementById("description");
const analyzeButton = document.getElementById("analyzeButton");
const messageBox = document.getElementById("messageBox");
const analysisResult = document.getElementById("analysisResult");
const complaintsTable = document.getElementById("complaintsTable");

let categoryChart = null;

const categories = [
    "Roads",
    "Water Supply",
    "Waste Management",
    "Streetlights",
    "Drainage",
    "Other"
];

const statuses = [
    "New",
    "Under Review",
    "Assigned",
    "Resolved"
];

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.hidden = false;
}

function hideMessage() {
    messageBox.hidden = true;
    messageBox.textContent = "";
}

function addTextElement(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text ?? "Not specified";

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);
    return element;
}

function getPriorityClass(priority) {
    if (priority === "High") return "priority-high";
    if (priority === "Medium") return "priority-medium";
    return "priority-normal";
}

function displayAnalysis(data) {
    analysisResult.replaceChildren();
    analysisResult.hidden = false;

    const card = document.createElement("div");
    card.className = "analysis-card";

    addTextElement(
        card,
        "h4",
        `AI Analysis · Case #${data.id}`
    );

    const grid = document.createElement("div");
    grid.className = "analysis-grid";

    const items = [
        ["Category", data.category],
        ["Summary", data.summary],
        ["Location", data.location],
        ["Duration", data.duration],
        ["Affected Area", data.affected_area],
        ["Recommended Action", data.recommended_action],
        ["Priority Reason", data.priority_reason]
    ];

    items.forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "analysis-item";

        addTextElement(item, "small", label);
        addTextElement(item, "p", value || "Not specified");

        grid.appendChild(item);
    });

    const priorityItem = document.createElement("div");
    priorityItem.className = "analysis-item";

    addTextElement(priorityItem, "small", "Suggested Priority");
    addTextElement(
        priorityItem,
        "span",
        data.priority,
        `priority ${getPriorityClass(data.priority)}`
    );

    grid.appendChild(priorityItem);
    card.appendChild(grid);
    analysisResult.appendChild(card);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideMessage();
    analysisResult.hidden = true;

    const description = descriptionInput.value.trim();

    if (description.length < 10 || description.length > 3000) {
        showMessage(
            "Please enter a complaint between 10 and 3000 characters.",
            "error"
        );
        return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    try {
        const response = await fetch("/api/complaints", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ description })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Complaint processing failed.");
        }

        showMessage(
            "Complaint analyzed and saved successfully.",
            "success"
        );

        displayAnalysis(data);
        descriptionInput.value = "";

        await loadComplaints();

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Complaint →";
    }
});

function createCell(row, text, className = "") {
    const cell = document.createElement("td");

    if (className) {
        cell.className = className;
    }

    cell.textContent = text ?? "Not specified";
    row.appendChild(cell);

    return cell;
}

function createStatusSelect(complaint) {
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute(
        "aria-label",
        `Status for complaint ${complaint.id}`
    );

    statuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = complaint.status === status;
        select.appendChild(option);
    });

    select.addEventListener("change", async () => {
        select.disabled = true;

        try {
            const response = await fetch(
                `/api/complaints/${complaint.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: select.value })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Status update failed.");
            }

            await loadComplaints();

        } catch (error) {
            alert(error.message);
            await loadComplaints();
        } finally {
            select.disabled = false;
        }
    });

    return select;
}

function renderComplaints(complaints) {
    complaintsTable.replaceChildren();

    if (complaints.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell(
            row,
            "No complaints yet. Submit your first report above."
        );

        cell.colSpan = 5;
        cell.className = "empty-state";
        complaintsTable.appendChild(row);
        return;
    }

    complaints.forEach((complaint) => {
        const row = document.createElement("tr");

        const idCell = createCell(row, `#${complaint.id}`);
        idCell.style.fontWeight = "700";

        const descriptionCell = document.createElement("td");
        addTextElement(
            descriptionCell,
            "strong",
            complaint.summary || "Complaint"
        );
        addTextElement(
            descriptionCell,
            "small",
            complaint.location || "Location not specified"
        );
        row.appendChild(descriptionCell);

        createCell(row, complaint.category);

        const priorityCell = document.createElement("td");
        addTextElement(
            priorityCell,
            "span",
            complaint.priority,
            `priority ${getPriorityClass(complaint.priority)}`
        );
        row.appendChild(priorityCell);

        const statusCell = document.createElement("td");
        statusCell.appendChild(createStatusSelect(complaint));
        row.appendChild(statusCell);

        complaintsTable.appendChild(row);
    });
}

function renderChart(complaints) {
    const counts = categories.map(
        category => complaints.filter(
            complaint => complaint.category === category
        ).length
    );

    const canvas = document.getElementById("categoryChart");

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (typeof Chart === "undefined") {
        return;
    }

    categoryChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: [
                    "#6558d9",
                    "#4b9be8",
                    "#36b98a",
                    "#efb34e",
                    "#e87585",
                    "#9aa5b5"
                ],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

async function loadComplaints() {
    try {
        const response = await fetch("/api/complaints");

        if (!response.ok) {
            throw new Error("Could not load complaint records.");
        }

        const complaints = await response.json();

        document.getElementById("totalCount").textContent =
            complaints.length;

        document.getElementById("newCount").textContent =
            complaints.filter(c => c.status === "New").length;

        document.getElementById("highCount").textContent =
            complaints.filter(c => c.priority === "High").length;

        document.getElementById("resolvedCount").textContent =
            complaints.filter(c => c.status === "Resolved").length;

        renderComplaints(complaints);
        renderChart(complaints);

    } catch (error) {
        complaintsTable.replaceChildren();

        const row = document.createElement("tr");
        const cell = createCell(row, error.message);
        cell.colSpan = 5;
        cell.className = "empty-state";

        complaintsTable.appendChild(row);
    }
}

document.getElementById("refreshButton").addEventListener(
    "click",
    loadComplaints
);

document.getElementById("reportButton").addEventListener(
    "click",
    () => {
        document.getElementById("report").scrollIntoView({
            behavior: "smooth"
        });

        descriptionInput.focus();
    }
);

loadComplaints();