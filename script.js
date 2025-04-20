// Add these functions to script.js

// Function to store evaluation data for a poll
// Poll storage and management functions
function addOption() {
  const container = document.getElementById("options-container");
  const optionDiv = document.createElement("div");
  optionDiv.className = "option-group";
  
  // Create input element
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Option ${container.children.length + 1}`;
  input.className = "option-input";
  
  // Create remove button
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-option";
  removeBtn.setAttribute("onclick", "removeOption(this)");
  removeBtn.setAttribute("title", "Remove option");
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  
  // Append elements to option group
  optionDiv.appendChild(input);
  optionDiv.appendChild(removeBtn);
  
  // Append to container with animation
  container.appendChild(optionDiv);
  
  // Show all remove buttons if we have more than 2 options
  updateRemoveButtons();
  
  // Focus the new input
  input.focus();
}

function removeOption(button) {
  const optionGroup = button.parentElement;
  const container = optionGroup.parentElement;
  
  // Only remove if we have more than 2 options
  if (container.children.length > 2) {
    container.removeChild(optionGroup);
    
    // Update placeholders to maintain sequential numbering
    const inputs = container.querySelectorAll('.option-input');
    inputs.forEach((input, index) => {
      input.placeholder = `Option ${index + 1}`;
    });
    
    // Update remove buttons visibility
    updateRemoveButtons();
  }
}

function updateRemoveButtons() {
  const container = document.getElementById("options-container");
  const removeButtons = container.querySelectorAll('.remove-option');
  
  // Show remove buttons only if we have more than 2 options
  removeButtons.forEach(btn => {
    btn.style.visibility = container.children.length > 2 ? 'visible' : 'hidden';
  });
}

function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('alert-container');
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  // Set alert content
  alert.innerHTML = `
    <div class="alert-icon">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    </div>
    <div class="alert-message">${message}</div>
  `;
  
  // Add to container
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => {
      alertContainer.removeChild(alert);
    }, 300);
  }, 5000);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = toast.querySelector('.toast-message');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function validateForm() {
  const question = document.getElementById("question").value.trim();
  const options = [...document.querySelectorAll(".option-input")]
    .map(input => input.value.trim())
    .filter(val => val !== "");
  
  if (!question) {
    showAlert("Please enter a poll question.");
    return false;
  }
  
  if (options.length < 2) {
    showAlert("Please enter at least two options.");
    return false;
  }
  
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== options.length) {
    showAlert("All options must be unique.");
    return false;
  }
  
  return true;
}

// Generate random colors for poll options
function generateRandomColor() {
  const colors = [
    "#4776E6", "#8E54E9", "#4CAF50", "#FF9800", "#607D8B",
    "#E91E63", "#3F51B5", "#009688", "#FF5722", "#795548",
    "#9C27B0", "#2196F3", "#8BC34A", "#FFC107", "#9E9E9E"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Save a poll to localStorage
function savePoll(pollConfig) {
  // Get existing polls or initialize empty array
  let polls = JSON.parse(localStorage.getItem('polls') || '[]');
  
  // Check if we're updating an existing poll
  const existingIndex = polls.findIndex(p => p.id === pollConfig.id);
  
  if (existingIndex >= 0) {
    // Update existing poll
    polls[existingIndex] = pollConfig;
  } else {
    // Add new poll
    polls.push(pollConfig);
  }
  
  // Save back to localStorage
  localStorage.setItem('polls', JSON.stringify(polls));
  
  return pollConfig.id;
}

// Retrieve a specific poll by ID
function getPollById(pollId) {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  return polls.find(poll => poll.id === pollId) || null;
}

// Get all stored polls
function getAllPolls() {
  return JSON.parse(localStorage.getItem('polls') || '[]');
}

// Delete a poll by ID
function deletePollById(pollId) {
  let polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const filteredPolls = polls.filter(poll => poll.id !== pollId);
  localStorage.setItem('polls', JSON.stringify(filteredPolls));
  return filteredPolls.length !== polls.length; // Return true if deleted
}

// Create new poll
function createPoll() {
  if (!validateForm()) return;
  
  const question = document.getElementById("question").value.trim();
  const options = [...document.querySelectorAll(".option-input")]
    .map(input => input.value.trim())
    .filter(val => val !== "");
  
  // Get poll ID from URL if we're editing an existing poll
  const urlParams = new URLSearchParams(window.location.search);
  const existingPollId = urlParams.get('edit');
  
  // Generate a unique ID for a new poll
  const pollId = existingPollId || 'poll_' + Date.now();
  
  const pollConfig = {
    id: pollId,
    question,
    options: options.map(text => ({ 
      text, 
      votes: 0,
      color: generateRandomColor() 
    })),
    settings: {
      anonymous: document.getElementById("anonymous").checked,
      oneVote: document.getElementById("oneVote").checked,
      showResults: document.getElementById("showResults").checked,
      allowComments: document.getElementById("allowComments").checked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    totalVotes: 0,
    comments: []
  };
  
  // If we're editing, preserve existing votes and comments
  if (existingPollId) {
    const existingPoll = getPollById(existingPollId);
    if (existingPoll) {
      // Try to match options and keep votes when possible
      pollConfig.options = pollConfig.options.map(newOption => {
        const matchingOption = existingPoll.options.find(o => o.text === newOption.text);
        return matchingOption ? { ...newOption, votes: matchingOption.votes } : newOption;
      });
      
      pollConfig.totalVotes = pollConfig.options.reduce((sum, option) => sum + option.votes, 0);
      pollConfig.comments = existingPoll.comments || [];
      pollConfig.settings.createdAt = existingPoll.settings.createdAt;
    }
  }

  // Save poll to localStorage
  savePoll(pollConfig);
  
  console.log('Poll saved:', pollConfig);
  showToast(existingPollId ? "Poll updated successfully!" : "Poll created successfully!");
  
  // Redirect to the poll page
  setTimeout(() => {
    window.location.href = `poll.html?id=${pollId}`;
  }, 1000);
}

// Load poll data to edit form
function loadPollForEditing() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('edit');
  
  if (!pollId) return;
  
  const poll = getPollById(pollId);
  if (!poll) {
    showAlert("Poll not found", "error");
    return;
  }
  
  // Update page title
  document.querySelector('h1').textContent = "Edit Poll";
  
  // Fill form fields
  document.getElementById("question").value = poll.question;
  
  // Clear default options
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = '';
  
  // Add each option
  poll.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option-group";
    
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Option ${index + 1}`;
    input.className = "option-input";
    input.value = option.text;
    
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-option";
    removeBtn.setAttribute("onclick", "removeOption(this)");
    removeBtn.setAttribute("title", "Remove option");
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    optionDiv.appendChild(input);
    optionDiv.appendChild(removeBtn);
    optionsContainer.appendChild(optionDiv);
  });
  
  // Set checkbox values
  document.getElementById("anonymous").checked = poll.settings.anonymous;
  document.getElementById("oneVote").checked = poll.settings.oneVote;
  document.getElementById("showResults").checked = poll.settings.showResults;
  document.getElementById("allowComments").checked = poll.settings.allowComments;
  
  // Update form buttons
  const submitButton = document.querySelector('.btn-create');
  submitButton.textContent = "Update Poll";
  submitButton.innerHTML = 'Update Poll <i class="fas fa-save"></i>';
  
  // Update remove buttons visibility
  updateRemoveButtons();
}

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize remove buttons visibility
  updateRemoveButtons();
  
  // Check if we're editing an existing poll
  loadPollForEditing();
});
function storeEvaluationData(pollId, evaluationData) {
  // Get existing polls
  let polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const pollIndex = polls.findIndex(p => p.id === pollId);
  
  if (pollIndex >= 0) {
    // Initialize evaluation data if it doesn't exist
    if (!polls[pollIndex].evaluations) {
      polls[pollIndex].evaluations = [];
    }
    
    // Add timestamp to evaluation data
    evaluationData.timestamp = new Date().toISOString();
    evaluationData.evaluationId = 'eval_' + Date.now();
    
    // Add evaluation data to poll
    polls[pollIndex].evaluations.push(evaluationData);
    
    // Save back to localStorage
    localStorage.setItem('polls', JSON.stringify(polls));
    return true;
  }
  
  return false;
}

// Function to get evaluation data for a poll
function getEvaluationData(pollId) {
  const poll = getPollById(pollId);
  return poll?.evaluations || [];
}

// Function to export poll data with evaluations
function exportPollWithEvaluations(pollId) {
  const poll = getPollById(pollId);
  
  if (!poll) return null;
  
  // Create a formatted export object
  const exportData = {
    pollData: {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      totalVotes: poll.totalVotes,
      settings: poll.settings,
      createdAt: poll.settings.createdAt,
      updatedAt: poll.settings.updatedAt
    },
    evaluationData: poll.evaluations || [],
    comments: poll.comments || [],
    exportedAt: new Date().toISOString()
  };
  
  return exportData;
}

// Function to download poll data as JSON
function downloadPollData(pollId) {
  const exportData = exportPollWithEvaluations(pollId);
  
  if (!exportData) {
    showToast("Poll not found");
    return;
  }
  
  // Convert to JSON string
  const dataStr = JSON.stringify(exportData, null, 2);
  
  // Create download link
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `poll-${pollId}-evaluation-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast("Poll data exported successfully");
}