document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderActivities(activities) {
    activitiesList.replaceChildren();

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      activityCard.appendChild(title);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule:";
      schedule.append(scheduleLabel, ` ${details.schedule}`);
      activityCard.appendChild(schedule);

      const spotsLeft = details.max_participants - details.participants.length;
      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability:";
      availability.append(availabilityLabel, ` ${spotsLeft} spots left`);
      activityCard.appendChild(availability);

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      activityCard.appendChild(participantsHeading);

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";
      details.participants.forEach((email) => {
        const participant = document.createElement("li");
        const participantEmail = document.createElement("span");
        participantEmail.textContent = email;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-participant";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
        removeButton.title = `Remove ${email}`;
        removeButton.addEventListener("click", () => removeSignup(name, email, removeButton));

        participant.append(participantEmail, removeButton);
        participantsList.appendChild(participant);
      });
      activityCard.appendChild(participantsList);
      activitiesList.appendChild(activityCard);

      if (![...activitySelect.options].some((option) => option.value === name)) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    });
  }

  async function fetchActivities() {
    const response = await fetch("/activities");
    if (!response.ok) {
      throw new Error("Failed to load activities");
    }
    renderActivities(await response.json());
  }

  async function removeSignup(activity, email, button) {
    button.disabled = true;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to remove signup");
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      button.disabled = false;
      showMessage(error.message || "Failed to remove signup. Please try again.", "error");
      console.error("Error removing signup:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(error.message || "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities().catch((error) => {
    activitiesList.textContent = "Failed to load activities. Please try again later.";
    console.error("Error fetching activities:", error);
  });
});
