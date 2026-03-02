import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StethoscopeLoader from '../components/StethoscopeLoader';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  // Loader state
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash && hash !== '') {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    window.addEventListener('hashchange', handleScroll);
    if (window.location.hash) {
      handleScroll();
    }
    return () => window.removeEventListener('hashchange', handleScroll);
  }, [location]);

  // Handle Clinic Discovery with Premium Animation Transition
  const handleFindClinics = () => {
    setIsNavigating(true);
    // 2.8 seconds allows the user to appreciate the high-end animation
    setTimeout(() => {
      navigate('/directory');
    }, 2800);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await response.json();
      if (response.ok) {
        setContactSent(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setContactSent(false), 5000);
      } else {
        alert(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="relative overflow-x-hidden bg-white">
      {/* Premium Dark Glass Loader */}
      <StethoscopeLoader show={isNavigating} />

      {/* 
          Main Content Wrapper:
          - Keeps homepage visible behind the loader
          - Dims and blurs slightly when isNavigating is true
      */}
      <div
        className={`transition-all duration-1000 ease-in-out ${isNavigating
            ? "opacity-50 blur-[3px] scale-[0.98] pointer-events-none"
            : "opacity-100 blur-0 scale-100"
          } animate-in fade-in duration-700`}
      >
        {/* Hero - Home */}
        <section id="home" className="px-6 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
                  Your health, <span className="text-blue-700">made better.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-500 mb-12 leading-relaxed font-normal">
                  The most trusted healthcare discovery platform in India. Find and book appointments at premium clinics near you.
                </p>
                <button
                  onClick={handleFindClinics}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 self-start"
                >
                  Find Clinics Now
                </button>
              </div>

              <div className="flex items-center justify-center">
                <div className="frosted-glass p-4 md:p-6 rounded-3xl border border-white/50 shadow-2xl shadow-blue-50/40">
                  <img
                    src="/clinic finding.png"
                    alt="Clinic Finding"
                    className="w-full h-auto rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="px-6 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">What We Do</h2>
            <p className="text-gray-500 text-center max-w-2xl mx-auto mb-12 text-lg">
              We help you take control of your healthcare journey. Here’s how ClinicConnect supports you:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Clinic Discovery', description: 'Browse verified clinics and hospitals in your area.', icon: '🔍' },
                { title: 'Doctor Profiles', description: 'View doctor specializations and experience.', icon: '👨‍⚕️' },
                { title: 'Easy Booking', description: 'Book appointments online in a few clicks.', icon: '📅' },
                { title: 'Transparent Information', description: 'Access clear information on services and timings.', icon: '📋' },
                { title: 'Patient & Admin Accounts', description: 'One platform for patients and clinic admins.', icon: '👤' },
                { title: 'Trusted Directory', description: 'We list only verified healthcare providers.', icon: '✓' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="frosted-glass p-6 md:p-8 rounded-2xl border border-white/50 shadow-xl shadow-blue-50/40 hover:shadow-blue-100/60 transition-all"
                >
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-16 md:py-24 bg-gray-50/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">App Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'Find clinics by location', desc: 'Search and filter clinics near you.' },
                { title: 'View doctor details', desc: 'Specialization, experience, and clinic info.' },
                { title: 'Book appointments online', desc: 'Select date and time slot easily.' },
                { title: 'User accounts', desc: 'Sign up, log in, and manage your profile.' },
                { title: 'Responsive design', desc: 'Use ClinicConnect on phone, tablet, or desktop.' },
                { title: 'Secure & private', desc: 'Your data is handled with care.' },
              ].map((f) => (
                <div key={f.title} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{f.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Clinics */}
        <section className="px-6 py-16 md:py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">For Clinics & Healthcare Providers</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Join ClinicConnect to manage your clinic, doctors, and appointments efficiently.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                { icon: '👥', title: 'Manage Doctors', desc: 'Add and manage medical teams easily.' },
                { icon: '📅', title: 'Appointment Management', desc: 'Handle bookings and rescheduling.' },
                { icon: '📊', title: 'Analytics Dashboard', desc: 'Track performance and patient inquiries.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/clinic-register')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full text-lg font-bold shadow-xl transition-all hover:-translate-y-1 mr-4 mb-4 md:mb-0"
              >
                Register Your Clinic
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-full text-lg font-bold transition-all"
              >
                Clinic Admin Login
              </button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="px-6 py-16 md:py-24">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">Contact Us</h2>
            <div className="frosted-glass p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-xl">
              {contactSent ? (
                <div className="text-center py-8">
                  <p className="font-bold text-gray-900">Message sent!</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border"
                  />
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border"
                  />
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Your message..."
                    className="w-full px-4 py-3 rounded-xl border resize-none"
                  />
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="px-6 py-16 md:py-24 bg-gray-50/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About ClinicConnect</h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
              ClinicConnect is a premium healthcare directory that connects patients with trusted clinics and doctors.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;