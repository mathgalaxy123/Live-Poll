// Add these functions to poll.js

// Load poll data from localStorage
function loadPoll() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  if (!pollId) {
    showToast("Poll ID not found");
    return;
  }
  
  const poll = getPollById(pollId);
  if (!poll) {
    showToast("Poll not found");
    return;
  }
  
  // Set poll question
  document.getElementById("poll-question").textContent = poll.question;
  
  // Populate options
  const optionsContainer = document.getElementById("poll-options");
  optionsContainer.innerHTML = '';
  
  poll.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "poll-option";
    optionDiv.setAttribute("data-index", index);
    optionDiv.onclick = function() { selectOption(this) };
    
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "poll-option";
    input.value = index;
    
    const label = document.createElement("span");
    label.textContent = option.text;
    
    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    optionsContainer.appendChild(optionDiv);
  });
  
  // Show comments section if allowed
  if (poll.settings.allowComments) {
    document.getElementById("comments-section").style.display = "block";
    loadComments(poll);
  }
  
  // Check if results should be displayed
  if (!poll.settings.showResults) {
    document.getElementById("results-container").style.display = "none";
  }
}

function selectOption(element) {
  // Remove selection from all options
  const options = document.querySelectorAll('.poll-option');
  options.forEach(opt => opt.classList.remove('selected'));
  
  // Add selection to clicked option
  element.classList.add('selected');
  
  // Check the radio button
  const radioBtn = element.querySelector('input[type="radio"]');
  radioBtn.checked = true;
}

function submitVote() {
  const selectedOption = document.querySelector('input[name="poll-option"]:checked');
  
  if (!selectedOption) {
    showToast("Please select an option");
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  if (!pollId) return;
  
  const optionIndex = parseInt(selectedOption.value);
  
  // Get poll data
  let polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const pollIndex = polls.findIndex(p => p.id === pollId);
  
  if (pollIndex >= 0) {
    // Increment votes for the selected option
    polls[pollIndex].options[optionIndex].votes++;
    polls[pollIndex].totalVotes++;
    
    // Update poll in localStorage
    localStorage.setItem('polls', JSON.stringify(polls));
    
    showToast("Vote submitted successfully!");
    
    // Show results after voting
    if (polls[pollIndex].settings.showResults) {
      showResults(polls[pollIndex]);
    }
  }
}

function showResults(poll) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.style.display = "block";
  
  // Update results summary
  const resultsSummary = document.getElementById("results-summary");
  resultsSummary.innerHTML = `
    <p><strong>Total Votes:</strong> ${poll.totalVotes}</p>
  `;
  
  // Create chart data
  const labels = poll.options.map(option => option.text);
  const data = poll.options.map(option => option.votes);
  const backgroundColor = poll.options.map(option => option.color);
  
  // Create or update chart
  const ctx = document.getElementById('poll-chart').getContext('2d');
  
  if (window.pollChart) {
    // Update existing chart
    window.pollChart.data.labels = labels;
    window.pollChart.data.datasets[0].data = data;
    window.pollChart.data.datasets[0].backgroundColor = backgroundColor;
    window.pollChart.update();
  } else {
    // Create new chart
    window.pollChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Votes',
          data: data,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor.map(color => color),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            precision: 0
          }
        }
      }
    });
  }
}

function loadComments(poll) {
  const commentsList = document.getElementById("comments-list");
  commentsList.innerHTML = '';
  
  if (!poll.comments || poll.comments.length === 0) {
    commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
    return;
  }
  
  poll.comments.forEach(comment => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment";
    commentDiv.style.padding = "10px";
    commentDiv.style.borderBottom = "1px solid #e2e8f0";
    commentDiv.style.marginBottom = "10px";
    
    const commentMeta = document.createElement("div");
    commentMeta.style.fontSize = "12px";
    commentMeta.style.color = "#718096";
    commentMeta.style.marginBottom = "5px";
    commentMeta.textContent = new Date(comment.timestamp).toLocaleString();
    
    const commentText = document.createElement("div");
    commentText.textContent = comment.text;
    
    commentDiv.appendChild(commentMeta);
    commentDiv.appendChild(commentText);
    commentsList.appendChild(commentDiv);
  });
}

function addComment() {
  const commentInput = document.getElementById("comment-input");
  const commentText = commentInput.value.trim();
  
  if (!commentText) {
    showToast("Please enter a comment");
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  // Get poll data
  let polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const pollIndex = polls.findIndex(p => p.id === pollId);
  
  if (pollIndex >= 0) {
    // Initialize comments array if not exists
    if (!polls[pollIndex].comments) {
      polls[pollIndex].comments = [];
    }
    
    // Add new comment
    polls[pollIndex].comments.push({
      text: commentText,
      timestamp: new Date().toISOString()
    });
    
    // Update poll in localStorage
    localStorage.setItem('polls', JSON.stringify(polls));
    
    // Reload comments
    loadComments(polls[pollIndex]);
    
    // Clear input
    commentInput.value = '';
    
    showToast("Comment added successfully!");
  }
}

function sharePoll() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  if (!pollId) return;
  
  // Get the current URL
  const pollUrl = window.location.origin + window.location.pathname + '?id=' + pollId;
  
  // Check if Web Share API is available
  if (navigator.share) {
    navigator.share({
      title: 'Vote in my poll',
      url: pollUrl
    })
    .then(() => showToast('Poll shared successfully'))
    .catch((error) => showToast('Error sharing poll'));
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(pollUrl)
      .then(() => {
        showToast('Poll URL copied to clipboard');
      })
      .catch((err) => {
        // Create a temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = pollUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showToast('Poll URL copied to clipboard');
      });
  }
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

function showEvaluationForm() {
  // Check if evaluation section already exists
  let evaluationSection = document.getElementById("evaluation-section");
  
  if (!evaluationSection) {
    // Create evaluation section
    evaluationSection = document.createElement("div");
    evaluationSection.id = "evaluation-section";
    evaluationSection.style.marginTop = "30px";
    evaluationSection.className = "admin-card";
    
    // Create form content
    evaluationSection.innerHTML = `
      <h2>Poll Evaluation</h2>
      <div class="form-group">
        <label for="effectiveness">Effectiveness (1-5):</label>
        <div class="rating-container">
          <div class="rating-options">
            <span class="rating-option" data-value="1" onclick="setRating('effectiveness', 1)">1</span>
            <span class="rating-option" data-value="2" onclick="setRating('effectiveness', 2)">2</span>
            <span class="rating-option" data-value="3" onclick="setRating('effectiveness', 3)">3</span>
            <span class="rating-option" data-value="4" onclick="setRating('effectiveness', 4)">4</span>
            <span class="rating-option" data-value="5" onclick="setRating('effectiveness', 5)">5</span>
          </div>
          <input type="hidden" id="effectiveness" value="0">
        </div>
      </div>
      
      <div class="form-group">
        <label for="clarity">Question Clarity (1-5):</label>
        <div class="rating-container">
          <div class="rating-options">
            <span class="rating-option" data-value="1" onclick="setRating('clarity', 1)">1</span>
            <span class="rating-option" data-value="2" onclick="setRating('clarity', 2)">2</span>
            <span class="rating-option" data-value="3" onclick="setRating('clarity', 3)">3</span>
            <span class="rating-option" data-value="4" onclick="setRating('clarity', 4)">4</span>
            <span class="rating-option" data-value="5" onclick="setRating('clarity', 5)">5</span>
          </div>
          <input type="hidden" id="clarity" value="0">
        </div>
      </div>
      
      <div class="form-group">
        <label for="engagement">User Engagement (1-5):</label>
        <div class="rating-container">
          <div class="rating-options">
            <span class="rating-option" data-value="1" onclick="setRating('engagement', 1)">1</span>
            <span class="rating-option" data-value="2" onclick="setRating('engagement', 2)">2</span>
            <span class="rating-option" data-value="3" onclick="setRating('engagement', 3)">3</span>
            <span class="rating-option" data-value="4" onclick="setRating('engagement', 4)">4</span>
            <span class="rating-option" data-value="5" onclick="setRating('engagement', 5)">5</span>
          </div>
          <input type="hidden" id="engagement" value="0">
        </div>
      </div>
      
      <div class="form-group">
        <label for="eval-notes">Evaluation Notes:</label>
        <textarea id="eval-notes" rows="4" placeholder="Add your evaluation notes here..."></textarea>
      </div>
      
      <button class="add-option" style="width: auto; margin-top: 15px;" onclick="submitEvaluation()">
        <i class="fas fa-save"></i> Save Evaluation
      </button>
      
      <button class="add-option" style="width: auto; margin-top: 15px; margin-left: 10px;" onclick="downloadEvaluationData()">
        <i class="fas fa-download"></i> Export Data
      </button>
    `;
    
    // Add to container
    document.querySelector('.container').appendChild(evaluationSection);
  }
}

function setRating(field, value) {
  // Update the hidden input value
  document.getElementById(field).value = value;
  
  // Update UI - fix the selector to target only rating options for this specific field
  const ratingOptions = document.querySelectorAll(`.rating-options span[data-value]`);
  ratingOptions.forEach(option => {
    // Get the field name from the parent elements
    const fieldName = option.closest('.form-group').querySelector('input[type="hidden"]').id;
    
    // Only update the options for the current field
    if (fieldName === field) {
      if (parseInt(option.dataset.value) <= value) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    }
  });
}

function submitEvaluation() {
  // Get poll ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  // Get evaluation data
  const effectiveness = parseInt(document.getElementById('effectiveness').value);
  const clarity = parseInt(document.getElementById('clarity').value);
  const engagement = parseInt(document.getElementById('engagement').value);
  const notes = document.getElementById('eval-notes').value.trim();
  
  // Validate
  if (effectiveness === 0 || clarity === 0 || engagement === 0) {
    showToast("Please rate all categories");
    return;
  }
  
  // Create evaluation object
  const evaluationData = {
    effectiveness,
    clarity,
    engagement,
    notes,
    overallScore: ((effectiveness + clarity + engagement) / 3).toFixed(1)
  };
  
  // Store evaluation
  if (storeEvaluationData(pollId, evaluationData)) {
    showToast("Evaluation saved successfully");
    
    // Clear form
    document.getElementById('effectiveness').value = 0;
    document.getElementById('clarity').value = 0;
    document.getElementById('engagement').value = 0;
    document.getElementById('eval-notes').value = '';
    
    // Reset UI
    document.querySelectorAll('.rating-option').forEach(option => {
      option.classList.remove('selected');
    });
    
  } else {
    showToast("Failed to save evaluation");
  }
}

function downloadEvaluationData() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  // Call the download function from script.js
  downloadPollData(pollId);
}

function deletePoll(pollId) {
  if (confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
    // Get existing polls
    let polls = JSON.parse(localStorage.getItem('polls') || '[]');
    
    // Filter out the poll to delete
    const updatedPolls = polls.filter(poll => poll.id !== pollId);
    
    // Save back to localStorage
    localStorage.setItem('polls', JSON.stringify(updatedPolls));
    
    showToast("Poll deleted successfully!");
    
    // Redirect to home page after deletion
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

// Create action buttons container and add buttons
function addActionButtons() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('id');
  
  if (!pollId) return;
  
  // Create a container for all action buttons (if it doesn't exist)
  let actionButtonsContainer = document.getElementById("action-buttons-container");
  if (!actionButtonsContainer) {
    actionButtonsContainer = document.createElement("div");
    actionButtonsContainer.id = "action-buttons-container";
    actionButtonsContainer.style.textAlign = "center";
    actionButtonsContainer.style.marginTop = "30px";
    
    // Create share button
    const shareBtn = document.createElement("button");
    shareBtn.className = "add-option";
    shareBtn.style.width = "auto";
    shareBtn.style.display = "inline-block";
    shareBtn.style.margin = "10px 5px";
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Poll';
    shareBtn.onclick = sharePoll;
    
    // Create evaluate button
    const evalBtn = document.createElement("button");
    evalBtn.className = "add-option";
    evalBtn.style.width = "auto";
    evalBtn.style.display = "inline-block";
    evalBtn.style.margin = "10px 5px";
    evalBtn.innerHTML = '<i class="fas fa-clipboard-check"></i> Evaluate Poll';
    evalBtn.onclick = showEvaluationForm;
    
    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "add-option";
    deleteBtn.style.width = "auto";
    deleteBtn.style.display = "inline-block";
    deleteBtn.style.margin = "10px 5px";
    deleteBtn.style.backgroundColor = "#e53e3e";
    deleteBtn.style.color = "white";
    deleteBtn.style.borderColor = "#e53e3e";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Poll';
    deleteBtn.onclick = function() {
      deletePoll(pollId);
    };
    
    // Add buttons to container
    actionButtonsContainer.appendChild(shareBtn);
    actionButtonsContainer.appendChild(evalBtn);
    actionButtonsContainer.appendChild(deleteBtn);
    
    // Add container to the main container
    document.querySelector('.container').appendChild(actionButtonsContainer);
  }
}

// Entry point when document is ready
document.addEventListener("DOMContentLoaded", () => {
  loadPoll();
  addActionButtons(); // Add a single set of action buttons
  
  // Remove any existing share buttons from the DOM to avoid duplicates
  const existingShareBtns = document.querySelectorAll('.container > div:last-of-type:not(#action-buttons-container)');
  existingShareBtns.forEach(btn => {
    if (btn.textContent.includes('Share Poll')) {
      btn.remove();
    }
  });
});