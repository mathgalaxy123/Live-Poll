// Add these functions to admin.js

function loadEvaluationData() {
  // Get all polls with evaluations
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const pollsWithEvals = polls.filter(poll => poll.evaluations && poll.evaluations.length > 0);
  
  // Create evaluation section if needed
  let evalSection = document.getElementById("evaluations-section");
  
  if (!evalSection) {
    evalSection = document.createElement("div");
    evalSection.id = "evaluations-section";
    evalSection.className = "admin-card";
    evalSection.innerHTML = "<h2>Poll Evaluations</h2>";
    
    // Add to container after recent polls
    const recentPollsSection = document.querySelector(".admin-card:nth-child(3)");
    recentPollsSection.parentNode.insertBefore(evalSection, recentPollsSection.nextSibling);
  }
  
  // Check if there are evaluations
  if (pollsWithEvals.length === 0) {
    evalSection.innerHTML += "<p>No evaluations available yet.</p>";
    return;
  }
  
  // Create table
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  
  // Create header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
      <th style="padding: 12px 8px;">Poll</th>
      <th style="padding: 12px 8px;">Evaluations</th>
      <th style="padding: 12px 8px;">Avg. Score</th>
      <th style="padding: 12px 8px;">Actions</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement("tbody");
  
  pollsWithEvals.forEach(poll => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #e2e8f0";
    
    // Calculate average score
    const totalScore = poll.evaluations.reduce((sum, eval) => sum + parseFloat(eval.overallScore), 0);
    const avgScore = (totalScore / poll.evaluations.length).toFixed(1);
    
    tr.innerHTML = `
      <td style="padding: 12px 8px;">
        <a href="poll.html?id=${poll.id}" style="color: #4776E6; text-decoration: none; font-weight: 500;">
          ${poll.question}
        </a>
      </td>
      <td style="padding: 12px 8px;">${poll.evaluations.length}</td>
      <td style="padding: 12px 8px;">
        <span style="
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 14px;
          background-color: ${getScoreColor(avgScore)};
          color: white;
        ">
          ${avgScore}/5.0
        </span>
      </td>
      <td style="padding: 12px 8px;">
        <button onclick="viewEvaluations('${poll.id}')" style="
          background: none;
          border: none;
          color: #4776E6;
          cursor: pointer;
          margin-right: 8px;
        " title="View Evaluations">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="exportEvaluations('${poll.id}')" style="
          background: none;
          border: none;
          color: #4776E6;
          cursor: pointer;
        " title="Export Evaluations">
          <i class="fas fa-download"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  evalSection.appendChild(table);
}

function getScoreColor(score) {
  if (score >= 4.5) return "#48bb78"; // green
  if (score >= 3.5) return "#4776E6"; // blue
  if (score >= 2.5) return "#f6ad55"; // orange
  return "#e53e3e"; // red
}

function viewEvaluations(pollId) {
  // Get poll data
  const poll = getPollById(pollId);
  
  if (!poll || !poll.evaluations || poll.evaluations.length === 0) {
    showToast("No evaluations available for this poll");
    return;
  }
  
  // Create modal for evaluations
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";
  
  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.backgroundColor = "white";
  modalContent.style.padding = "25px";
  modalContent.style.borderRadius = "8px";
  modalContent.style.width = "80%";
  modalContent.style.maxWidth = "700px";
  modalContent.style.maxHeight = "80vh";
  modalContent.style.overflow = "auto";
  
  // Modal header
  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Evaluations for: ${poll.question}</h2>
      <button id="closeModal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
    </div>
  `;
  
  // Create evaluation cards
  poll.evaluations.forEach(eval => {
    const evalTime = new Date(eval.timestamp).toLocaleString();
    
    const evalCard = document.createElement("div");
    evalCard.style.padding = "15px";
    evalCard.style.border = "1px solid #e2e8f0";
    evalCard.style.borderRadius = "8px";
    evalCard.style.marginBottom = "15px";
    
    evalCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-weight: 500;">Evaluation ID: ${eval.evaluationId}</span>
        <span style="color: #718096;">${evalTime}</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
        <div>
          <div style="font-size: 12px; color: #718096;">Effectiveness</div>
          <div style="font-size: 16px; font-weight: 500;">${eval.effectiveness}/5</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #718096;">Clarity</div>
          <div style="font-size: 16px; font-weight: 500;">${eval.clarity}/5</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #718096;">Engagement</div>
          <div style="font-size: 16px; font-weight: 500;">${eval.engagement}/5</div>
        </div>
      </div>
      <div>
        <div style="font-size: 12px; color: #718096;">Overall Score</div>
        <div style="font-size: 18px; font-weight: 600; color: ${getScoreColor(eval.overallScore)};">${eval.overallScore}/5.0</div>
      </div>
      ${eval.notes ? `
        <div style="margin-top: 10px;">
          <div style="font-size: 12px; color: #718096;">Notes</div>
          <div style="padding: 10px; background: #f7fafc; border-radius: 4px;">${eval.notes}</div>
        </div>
      ` : ''}
    `;
    
    modalContent.appendChild(evalCard);
  });
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal event
  document.getElementById("closeModal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function exportEvaluations(pollId) {
  // Use downloadPollData from script.js
  downloadPollData(pollId);
}

function getPollById(pollId) {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  return polls.find(poll => poll.id === pollId) || null;
}

// Modify the document load event to include the evaluation data
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  createVoteDistributionChart();
  loadRecentPolls();
  createActivityChart();
  loadEvaluationData(); // Add this line
});
// Add these missing functions to admin.js

// Function to load statistics
function loadStats() {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const statsGrid = document.getElementById('stats-grid');
  
  // Calculate stats
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const totalOptions = polls.reduce((sum, poll) => sum + poll.options.length, 0);
  const totalComments = polls.reduce((sum, poll) => sum + (poll.comments?.length || 0), 0);
  
  // Create stats boxes
  const statsData = [
    { label: 'Total Polls', value: totalPolls, icon: 'fa-poll' },
    { label: 'Total Votes', value: totalVotes, icon: 'fa-vote-yea' },
    { label: 'Total Options', value: totalOptions, icon: 'fa-list' },
    { label: 'Total Comments', value: totalComments, icon: 'fa-comments' }
  ];
  
  // Populate stats grid
  statsGrid.innerHTML = '';
  statsData.forEach(stat => {
    const statBox = document.createElement('div');
    statBox.className = 'stat-box';
    statBox.innerHTML = `
      <div class="stat-icon"><i class="fas ${stat.icon}"></i></div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    `;
    statsGrid.appendChild(statBox);
  });
}

// Function to create vote distribution chart
function createVoteDistributionChart() {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  
  // Skip if no polls
  if (polls.length === 0) {
    document.getElementById('vote-distribution-chart').parentElement.innerHTML = '<p>No poll data available</p>';
    return;
  }
  
  // Get poll with most votes for visualization
  const sortedPolls = [...polls].sort((a, b) => b.totalVotes - a.totalVotes);
  const topPoll = sortedPolls[0];
  
  // Prepare chart data
  const labels = topPoll.options.map(opt => opt.text);
  const data = topPoll.options.map(opt => opt.votes);
  const backgroundColor = topPoll.options.map(opt => opt.color);
  
  // Create chart
  const ctx = document.getElementById('vote-distribution-chart').getContext('2d');
  
  // Set chart size constraints
  ctx.canvas.style.maxHeight = '300px';
  ctx.canvas.height = 300;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Votes',
        data: data,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Most Voted Poll: ${topPoll.question}`,
          font: {
            size: 14
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Function to load recent polls
function loadRecentPolls() {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  const recentPollsList = document.getElementById('recent-polls-list');
  
  if (polls.length === 0) {
    recentPollsList.innerHTML = '<p>No polls created yet</p>';
    return;
  }
  
  // Sort polls by creation date (newest first)
  const sortedPolls = [...polls].sort((a, b) => {
    return new Date(b.settings.createdAt) - new Date(a.settings.createdAt);
  });
  
  // Take the 5 most recent polls
  const recentPolls = sortedPolls.slice(0, 5);
  
  // Create poll list
  recentPollsList.innerHTML = '';
  recentPolls.forEach(poll => {
    const pollItem = document.createElement('div');
    pollItem.className = 'recent-poll-item';
    
    const createdDate = new Date(poll.settings.createdAt).toLocaleDateString();
    
    pollItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; 
           padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <div>
          <div style="font-weight: 500;">${poll.question}</div>
          <div style="font-size: 12px; color: #718096;">Created: ${createdDate}</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="background: #EDF2F7; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${poll.totalVotes} votes
          </span>
          <a href="poll.html?id=${poll.id}" style="color: #4776E6; font-size: 14px;">
            <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    `;
    
    recentPollsList.appendChild(pollItem);
  });
}

// Function to create activity chart
function createActivityChart() {
  const polls = JSON.parse(localStorage.getItem('polls') || '[]');
  
  // Skip if no polls
  if (polls.length === 0) {
    document.getElementById('activity-chart').parentElement.innerHTML = '<p>No activity data available</p>';
    return;
  }
  
  // Get dates for last 7 days
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // Format dates as strings for comparison
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Count polls created on each date
  const pollCounts = dates.map(date => {
    const dateStr = formatDate(date);
    return polls.filter(poll => {
      const pollDate = new Date(poll.settings.createdAt);
      return formatDate(pollDate) === dateStr;
    }).length;
  });
  
  // Count votes on each date (this would require vote timestamps, using random data here)
  const voteData = dates.map((date, index) => {
    // For demo purposes, generate random vote counts
    // In a real app, you'd track when votes were cast
    return Math.floor(Math.random() * 10) + (index * 2);
  });
  
  // Format labels as day names
  const labels = dates.map(date => date.toLocaleDateString('en-US', { weekday: 'short' }));
  
  // Create chart
  const ctx = document.getElementById('activity-chart').getContext('2d');
  
  // Set chart size constraints
  ctx.canvas.style.maxHeight = '300px';
  ctx.canvas.height = 300;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Polls Created',
          data: pollCounts,
          borderColor: '#4776E6',
          backgroundColor: 'rgba(71, 118, 230, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Votes Cast',
          data: voteData,
          borderColor: '#8E54E9',
          backgroundColor: 'rgba(142, 84, 233, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Activity (Last 7 Days)',
          font: {
            size: 14
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}