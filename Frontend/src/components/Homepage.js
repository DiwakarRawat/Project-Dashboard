import React from "react";
import { Link } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
  return (
    <div className="homepage">
      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to DTI Dashboard</h1>
          <p>
            "Think. Create. Grow"<br />
            "Students submit projects, mentors guide, and progress thrives - all in one place."<br /><br />
            Stay organized, get feedback and bring ideas to life!
          </p>
          <button className="get-started-btn"><Link to="/Register">Get Started</Link></button>
        </div>

        {/* Stats Dashboard on Right */}
        <div className="stats-dashboard">
          <h2>📊 DTI Dashboard Overview</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <h3>24</h3>
              <p>Active Projects</p>
            </div>
            <div className="stat-card">
              <h3>156</h3>
              <p>Students</p>
            </div>
            <div className="stat-card">
              <h3>8</h3>
              <p>Faculty</p>
            </div>
          </div>
          <div className="analytics-box">
            <p>Project Analytics & Insights</p>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3>Smart Analytics</h3>
            <p>Track progress with detailed insights and visual reports.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤝</span>
            <h3>Collaboration</h3>
            <p>Seamless communication between students and mentors.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Real-time Alerts</h3>
            <p>Get instant updates on project changes and activities.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📂</span>
            <h3>Project Management</h3>
            <p>Organize, assign tasks, and manage workflows effectively.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">📝</div>
            <h3>1. Submit Project</h3>
            <p>Students upload their ideas and share project details.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">👩‍🏫</div>
            <h3>2. Mentor Guidance</h3>
            <p>Mentors review, give feedback, and guide improvements.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">⚙️</div>
            <h3>3. Track Progress</h3>
            <p>Monitor milestones, tasks, and deadlines with ease.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">🚀</div>
            <h3>4. Launch & Grow</h3>
            <p>Finalize projects and showcase them with confidence.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
<section id="contact" className="contact-section">
  <div className="contact-container">
    <div className="contact-info">
      <h2 className="contact-logo">📚 ProjectNest</h2>
      <p>
        Empowering students and mentors with seamless project management.<br />
        "Track progress, collaborate effectively, and achieve success together".
      </p>
      <p className="contact-email">📧 projectnest123@gmail.com</p>
    </div>

    <div className="contact-links">
      <div className="contact-column">
        <h3>Product</h3>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#integration">Integrations</a></li>
        </ul>
      </div>
      <div className="contact-column">
        <h3>Company</h3>
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#careers">Careers</a></li>
          <li><a href="#privacy">Privacy</a></li>
          <li><a href="#terms">Terms</a></li>
        </ul>
      </div>
    </div>
  </div>

  <div className="contact-footer">
    <p>© 2025 DTI - Project Management Dashboard. All rights reserved.</p>
    <div className="social-icons">
      <a href="abc.com"><i className="fab fa-linkedin"></i></a>
      <a href="xyz.com"><i className="fab fa-twitter"></i></a>
      <a href="mno.com"><i className="fab fa-github"></i></a>
    </div>
  </div>
</section>

    </div>
  );
};

export default Homepage;