import { useState } from 'react';
import api from '../utils/api';
import './About.css';

const About = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="about-page">
      <div className="container">
        {/* Hero */}
        <div className="about-hero">
          <h1>About IntelliMart</h1>
          <p className="about-lead">The smarter way to manage, classify, and sell products online</p>
        </div>

        {/* What is IntelliMart */}
        <section className="about-section">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">storefront</span>
                <h3>E-Commerce Platform</h3>
                <p>IntelliMart is a full-featured online marketplace where sellers can list products and buyers can browse, search, and purchase items across multiple categories. From electronics to fashion, our platform handles it all.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">psychology</span>
                <h3>AI-Powered Classification</h3>
                <p>What makes IntelliMart unique is our built-in machine learning engine. When sellers upload a product, our AI automatically categorizes it into the right category — no manual tagging required.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">shopping_cart</span>
                <h3>Buyer Experience</h3>
                <p>Buyers enjoy a seamless shopping experience with smart product recommendations, a full cart and checkout system, multiple payment methods, and real-time order tracking.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">dashboard</span>
                <h3>Seller Dashboard</h3>
                <p>Sellers get a powerful dashboard to manage their inventory, track classification accuracy, monitor product performance, and add new products with one-click AI categorization.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">analytics</span>
                <h3>Real-Time Analytics</h3>
                <p>Access detailed analytics including category distribution, product trends over time, and platform-wide statistics to make data-driven decisions.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card">
                <span className="material-symbols-outlined about-card-icon">security</span>
                <h3>Secure Authentication</h3>
                <p>IntelliMart uses email-verified registration with OTP, JWT-based sessions, and role-based access control to keep every account safe and every transaction secure.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="about-section contact-section">
          <h2>Get In Touch</h2>
          <p className="contact-subtitle">Have a question or want to collaborate? Send us a message.</p>
          
          <div className="contact-card">
            {sent ? (
              <div className="contact-success">
                <span className="material-symbols-outlined success-check">check_circle</span>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you soon.</p>
                <button className="btn-contact" onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="contact-error">{error}</div>}
                <div className="contact-form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" className="form-input" placeholder="Your name"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" className="form-input" placeholder="your@email.com"
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" className="form-input" placeholder="What is this about?"
                    value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea className="form-input" rows="5" placeholder="Write your message here..."
                    value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                </div>
                <button type="submit" className="btn-contact" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
