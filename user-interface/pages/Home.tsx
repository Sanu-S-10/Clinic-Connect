
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get the hash from the URL
      const hash = window.location.hash.replace('#/', '').replace('#', '');

      // Only scroll to sections if there's an actual hash
      if (hash && hash !== '') {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleScroll);

    // Scroll on hash change (not on initial mount without hash)
    if (window.location.hash) {
      handleScroll();
    }

    return () => window.removeEventListener('hashchange', handleScroll);
  }, [location]);

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
        // Reset success message after 5 seconds
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
    <div className="animate-in fade-in duration-700 bg-[#DCEBFC] min-h-screen relative overflow-hidden">
      {/* Background Curved Shades */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left Curve */}
        <svg className="absolute top-0 left-0 w-[50%] md:w-[450px] h-[400px] md:h-[600px] text-[#CBDFFA] opacity-70" viewBox="0 0 450 600" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,0 L250,0 C180,150 280,300 150,450 C80,530 50,580 0,600 Z" />
        </svg>
      </div>

      {/* Hero - Home */}
      <section id="home" className="px-6 flex flex-col items-center justify-center min-h-[70vh] relative w-full">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side - Text and Button */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-[#23455E] mb-6 leading-[1.1] tracking-tight">
                Your health, <span className="text-blue-600">made better.</span>
              </h1>
              <p className="text-lg md:text-xl text-[#3A5B74] mb-10 leading-relaxed font-medium max-w-[90%]">
                Connecting people with reliable healthcare, effortlessly. Find and book appointments at trusted clinics near you.
              </p>

              <button
                onClick={() => navigate('/directory')}
                className="bg-[#3981C5] hover:bg-blue-700 text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 self-start"
              >
                Find Clinics Now
              </button>
            </div>

            {/* Right side - Image */}
            <div className="flex items-center justify-center relative">
              <img
                src="/clinic finding.png"
                alt="Clinic Finding"
                className="w-full max-w-lg lg:max-w-xl h-auto relative z-10"
                style={{
                  WebkitMaskImage: 'radial-gradient(50% 50% at 50% 50%, black 70%, transparent 100%)',
                  maskImage: 'radial-gradient(50% 50% at 50% 50%, black 70%, transparent 100%)'
                }}
              />

              {/* Top Right Glass Card Overlay */}
              <div className="absolute top-12 right-0 md:top-8 md:-right-12 z-20 bg-white/20 backdrop-blur-lg border border-white/60 p-3 pr-8 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center gap-4 scale-[0.7] md:scale-90">
                <div className="pr-4 pl-4 py-1">
                  <div className="text-xl font-black text-[#23455E] mb-[-2px]">Smart Clinic</div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#3A5B74]">
                    Discovery
                    <svg className="w-6 h-6 text-red-500 drop-shadow-md" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      <path fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12h6l.5-1 2 4.5 2-7 1.5 3.5h6"/>
                    </svg>
                  </div>
                </div>

                {/* Floating Icon */}
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-5 h-5 bg-[#3981C5] rounded-full flex items-center justify-center">
                    <span className="text-white text-[12px] leading-none mb-[1px]">★</span>
                  </div>
                </div>
              </div>

              {/* Middle Left Glass Card Overlay */}
              <div className="absolute top-[40%] -left-8 md:top-[45%] md:-left-24 z-20 bg-white/20 backdrop-blur-lg border border-white/60 p-3 pr-6 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center gap-3 scale-[0.7] md:scale-90">
                <div className="w-10 h-10 bg-green-100/80 rounded-full flex items-center justify-center text-green-600 ml-1 shadow-inner">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="pr-2">
                  <div className="text-lg font-black text-[#23455E]">Verified</div>
                  <div className="text-sm font-semibold text-[#3A5B74]">Professionals</div>
                </div>
              </div>



              {/* Bottom Left Glass Card Overlay */}
              <div className="absolute top-[75%] md:top-auto md:bottom-2 md:-left-16 z-20 bg-white/20 backdrop-blur-lg border border-white/60 p-3 pr-8 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center gap-4 scale-[0.7] md:scale-90">
                <div className="pr-4 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-[-2px]">
                    <div className="text-xl font-black text-[#23455E]">20+</div>
                    <svg className="w-6 h-6 text-[#3981C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                      <circle cx="20" cy="10" r="2"/>
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-[#3A5B74]">Medical Specialties</div>
                </div>

                {/* Floating Checkmark Icon */}
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-5 h-5 bg-[#3981C5] rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Bottom Right Glass Card Overlay */}
              <div className="absolute bottom-15 -right-4 md:bottom-36 md:-right-44 z-20 bg-white/20 backdrop-blur-lg border border-white/60 p-3 px-6 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex items-center justify-center scale-[0.7] md:scale-90">
                <div className="text-xl font-black text-[#23455E]">
                  Find <span className="text-[#3981C5] mx-1.5">•</span> Choose <span className="text-[#3981C5] mx-1.5">•</span> Book
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services - What we do & how it helps */}
      <section id="services" className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">What We Do</h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-12 text-lg">
            We help you take control of your healthcare journey. Here’s how ClinicConnect supports you:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Clinic Discovery',
                description: 'Browse verified clinics and hospitals in your area. See locations, timings, and services so you can choose the right fit.',
                icon: '🔍',
              },
              {
                title: 'Doctor Profiles',
                description: 'View doctor specializations, experience, and which clinic they work at. Make informed decisions before booking.',
                icon: '👨‍⚕️',
              },
              {
                title: 'Easy Booking',
                description: 'Book appointments online in a few clicks. Get confirmation and reminders so you never miss a visit.',
                icon: '📅',
              },
              {
                title: 'Transparent Information',
                description: 'Access clear information on services, timings, and contact details. No hidden surprises.',
                icon: '📋',
              },
              {
                title: 'Patient & Admin Accounts',
                description: 'Sign up as a patient to book, or as a clinic admin to manage your practice. One platform for everyone.',
                icon: '👤',
              },
              {
                title: 'Trusted Directory',
                description: 'We list only verified healthcare providers. Your safety and trust are our priority.',
                icon: '✓',
              },
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
              Join ClinicConnect to manage your clinic, doctors, and appointments efficiently. Reach more patients and streamline your operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: '👥',
                title: 'Manage Doctors',
                desc: 'Add and manage your medical team with specialties and experience details.'
              },
              {
                icon: '📅',
                title: 'Appointment Management',
                desc: 'Handle bookings, approvals, and rescheduling all in one place.'
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                desc: 'Track appointments, patient inquiries, and clinic performance.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/clinic-register')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-full text-lg font-bold shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 mr-4 mb-4 md:mb-0"
            >
              Register Your Clinic
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-full text-lg font-bold transition-all active:scale-95"
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
          <p className="text-gray-500 text-center mb-10">
            Have questions or feedback? Get in touch.
          </p>
          <div className="frosted-glass p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50">
            {contactSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900">Message sent!</p>
                <p className="text-gray-500 text-sm mt-1">We’ll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Your message..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-50 transition-all"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
          <div className="mt-10 text-center text-gray-500 text-sm">
            <p>Or reach us at: <a href="mailto:hello@clinicconnect.com" className="text-blue-600 font-semibold hover:underline">hello@clinicconnect.com</a></p>
          </div>
        </div>
      </section>

      {/* About - Last */}
      <section id="about" className="px-6 py-16 md:py-24 bg-gray-50/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About ClinicConnect</h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
            ClinicConnect is a premium healthcare directory that connects patients with trusted clinics and doctors. We believe everyone deserves easy access to quality healthcare.
          </p>
          <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Our mission is to simplify how you discover clinics, compare services, and book appointments—all in one place. Whether you need a general check-up, dental care, or specialist consultation, we help you find the right care near you.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
