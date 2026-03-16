import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { sendOtpEmail, sendContactEmail, sendAppointmentConfirmationEmail, sendAppointmentReminderEmail } from './services/email.js';
import { getChatbotResponse } from './services/chatbot.js';
import { generateOtp, hashOtp, storeOtp, getResetRecord, incrementAttempts, deleteReset, markVerified, OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS } from './services/otp.js';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db.js';
import { sendTestEmail } from './services/email.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test MongoDB connection
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    res.json({ status: 'ok', message: 'MongoDB connection successful' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example: Get all clinics
app.get('/api/clinics', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const clinicsFromCollection = await db.collection('clinics').find({}).toArray();
    const approvedRegistrations = await db.collection('clinicRegistrations').find({ status: 'approved' }).toArray();
    // Combine both sources, avoiding duplicates
    const allClinics = [...clinicsFromCollection];
    const clinicIds = new Set(clinicsFromCollection.map(c => c._id?.toString?.()));
    for (const reg of approvedRegistrations) {
      if (!clinicIds.has(reg._id?.toString?.())) {
        allClinics.push(reg);
      }
    }
    res.json(allClinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({
      error: 'Failed to fetch clinics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint: Check clinic counts
app.get('/api/debug/clinic-counts', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const clinicCount = await db.collection('clinics').countDocuments();
    const registrationCount = await db.collection('clinicRegistrations').countDocuments();
    const approvedCount = await db.collection('clinicRegistrations').countDocuments({ status: 'approved' });

    const clinics = await db.collection('clinics').find({}).toArray();
    const registrations = await db.collection('clinicRegistrations').find({ status: 'approved' }).toArray();

    res.json({
      clinicCount,
      registrationCount,
      approvedCount,
      clinicsData: clinics,
      approvalsData: registrations
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Example: Create a new clinic
app.post('/api/clinics', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('clinics').insertOne(req.body);
    res.status(201).json({
      message: 'Clinic created successfully',
      id: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get clinic details by ID (for clinic admin dashboard)
app.get('/api/clinics/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }
    const clinicObjectId = new ObjectId(String(id));
    // Try to find clinic in clinics collection first
    let clinic = await db.collection('clinics').findOne({ _id: clinicObjectId });
    // If not found, try clinicRegistrations collection (for approved clinics)
    if (!clinic) {
      clinic = await db.collection('clinicRegistrations').findOne({ _id: clinicObjectId, status: 'approved' });
    }
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json(clinic);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Update clinic details (clinic admin dashboard) - updates both clinics and clinicRegistrations
app.put('/api/clinics/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    const { name, email, phone, address, location, specialties, description, image, workingHours } = req.body;

    // Update clinic in clinics collection (for directory display)
    await db.collection('clinics').updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          name,
          email,
          phone,
          address: address || '',
          location: location || '',
          specialties: specialties || [],
          description: description || '',
          image: image || '',
          workingHours: workingHours || '',
          updatedAt: new Date()
        }
      }
    );

    // Also update in clinicRegistrations to keep registration data in sync
    await db.collection('clinicRegistrations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          email,
          phone,
          address: address || '',
          location: location || '',
          specialties: specialties || [],
          description: description || '',
          image: image || '',
          workingHours: workingHours || '',
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Clinic updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get clinic reviews
app.get('/api/clinics/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    
    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    const reviews = await db.collection('clinicReviews')
      .find({ clinicId: new ObjectId(String(id)) })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = reviews.map(r => ({
      id: r._id.toString(),
      ...r
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch reviews',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a clinic review
app.post('/api/clinics/:id/reviews', async (req: Request, res: Response) => {
  console.log('Received POST request for new review on clinic ID:', req.params.id);
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    const { rating, comment, userId, userName } = req.body;

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || rating % 0.5 !== 0) {
      return res.status(400).json({ error: 'Rating must be a number between 0.5 and 5, in increments of 0.5' });
    }

    const clinicId = new ObjectId(String(id));

    // Check if clinic exists
    let clinic = await db.collection('clinics').findOne({ _id: clinicId });
    if (!clinic) {
      clinic = await db.collection('clinicRegistrations').findOne({ _id: clinicId, status: 'approved' });
    }

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Insert review
    const result = await db.collection('clinicReviews').insertOne({
      clinicId,
      rating,
      comment: comment || '',
      userId: userId || null,
      userName: userName || 'Anonymous',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Recalculate average rating
    const allReviews = await db.collection('clinicReviews').find({ clinicId }).toArray();
    const reviewCount = allReviews.length;
    const avgRating = reviewCount > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0;
    
    const roundedRating = Math.round(avgRating * 2) / 2; // Round to nearest 0.5

    // Update clinic collections with new rating
    await db.collection('clinics').updateOne(
      { _id: clinicId },
      { $set: { rating: roundedRating, reviewCount } }
    );
    
    await db.collection('clinicRegistrations').updateOne(
      { _id: clinicId },
      { $set: { rating: roundedRating, reviewCount } }
    );

    res.status(201).json({
      message: 'Review added successfully',
      id: result.insertedId.toString(),
      rating: roundedRating,
      reviewCount
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to add review',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all doctors (can filter by clinicId if provided)
app.get('/api/doctors', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { clinicId } = req.query;
    const query = clinicId ? { clinicId: clinicId as string } : {};
    const doctors = await db.collection('doctors')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    const formatted = doctors.map(doc => ({
      id: doc._id.toString(),
      ...doc
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch doctors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new doctor
app.post('/api/doctors', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { name, specialty, clinicId, email, experience, previouslyWorked, active, image, clinicName, workingDays, workingHours } = req.body;

    if (!name || !clinicId) {
      return res.status(400).json({ error: 'Doctor name and clinicId are required' });
    }

    const result = await db.collection('doctors').insertOne({
      name,
      specialty: specialty || '',
      clinicId,
      email: email || '',
      experience: experience || '',
      previouslyWorked: previouslyWorked || '',
      image: image || '',
      clinicName: clinicName || '',
      workingDays: workingDays || '',
      workingHours: workingHours || '',
      active: active !== false,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Doctor created successfully',
      id: result.insertedId.toString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create doctor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update doctor
app.put('/api/doctors/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await db.collection('doctors').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Doctor updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update doctor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete doctor
app.delete('/api/doctors/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const result = await db.collection('doctors').deleteOne(
      { _id: new ObjectId(String(id)) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete all appointments for this doctor
    await db.collection('bookings').deleteMany({ doctorId: id });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete doctor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix endpoint: Update doctor's clinicId to match clinic's actual ID
app.put('/api/doctors/:doctorId/fix-clinic/:clinicId', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { doctorId, clinicId } = req.params as { doctorId: string; clinicId: string };

    if (!ObjectId.isValid(String(doctorId))) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    if (!ObjectId.isValid(String(clinicId))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    const result = await db.collection('doctors').updateOne(
      { _id: new ObjectId(String(doctorId)) },
      {
        $set: {
          clinicId: clinicId,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Doctor clinic ID updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update doctor clinic ID',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get bookings (can filter by clinicId, doctorId, patientName, or patientPhone)
app.get('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { clinicId, doctorId, patientName, patientPhone, includeCancelled } = req.query;
    const query: any = {};
    if (clinicId) query.clinicId = clinicId as string;
    if (doctorId) query.doctorId = doctorId as string;

    // Exclude cancelled appointments by default unless specifically requested
    if (includeCancelled !== 'true') {
      query.status = { $ne: 'Cancelled' };
    }

    // For patient search: use OR logic so patient can search by name OR phone
    if (patientName || patientPhone) {
      const orConditions: any[] = [];
      if (patientName) {
        orConditions.push({ patientName: { $regex: patientName as string, $options: 'i' } });
      }
      if (patientPhone) {
        orConditions.push({ patientPhone: patientPhone as string });
      }
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    console.log('Bookings query:', JSON.stringify(query));
    const bookings = await db.collection('bookings')
      .find(query)
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .toArray();

    console.log(`Found ${bookings.length} bookings for query:`, query);
    if (patientName || patientPhone) {
      console.log('Sample bookings from DB:', bookings.slice(0, 3).map(b => ({ id: b._id, patientName: b.patientName, patientPhone: b.patientPhone })));
    }

    const formatted = bookings.map(booking => ({
      id: booking._id.toString(),
      ...booking
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a booking (appointment)
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { clinicId, doctorId, patientName, patientEmail, patientPhone, appointmentDate, appointmentTime, notes, userId } = req.body;

    if (!clinicId || !doctorId || !patientName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        error: 'Missing required fields: clinicId, doctorId, patientName, appointmentDate, appointmentTime'
      });
    }

    // Check for scheduling conflicts
    const existingAppointment = await db.collection('bookings').findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $nin: ['Cancelled', 'Rejected'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        error: 'Time slot already booked for this doctor'
      });
    }

    // Generate token number that resets daily (1, 2, 3, etc per day)
    // Count bookings for this specific appointment date (not cancelled)
    const bookingsForDate = await db.collection('bookings')
      .find({
        appointmentDate: appointmentDate,
        status: { $ne: 'Cancelled' }
      })
      .toArray();

    const tokenNumber = String(bookingsForDate.length + 1);

    const result = await db.collection('bookings').insertOne({
      clinicId,
      doctorId,
      patientName,
      patientEmail: patientEmail || '',
      patientPhone: patientPhone || '',
      appointmentDate,
      appointmentTime,
      tokenNumber,
      userId: userId || '',
      status: 'Booked',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Send appointment confirmation email if email is provided
    if (patientEmail) {
      try {
        // Fetch doctor and clinic details for email
        let clinic = await db.collection('clinics').findOne({ _id: new ObjectId(String(clinicId)) });
        if (!clinic) {
          clinic = await db.collection('clinicRegistrations').findOne({ _id: new ObjectId(String(clinicId)), status: 'approved' });
        }

        let doctor = await db.collection('doctors').findOne({ _id: new ObjectId(String(doctorId)) });

        const clinicName = clinic?.name || 'Clinic';
        const doctorName = doctor?.name || 'Doctor';
        const clinicAddress = clinic?.address || clinic?.location || '';
        const clinicPhone = clinic?.phone || '';

        await sendAppointmentConfirmationEmail(
          patientEmail,
          patientName,
          clinicName,
          doctorName,
          appointmentDate,
          appointmentTime,
          tokenNumber,
          clinicAddress,
          clinicPhone
        );

        console.log(`[Booking] Confirmation email sent to ${patientEmail}`);
      } catch (emailError) {
        console.error('[Booking] Failed to send confirmation email:', emailError);
        // Continue even if email fails - don't block the booking
      }
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      id: result.insertedId.toString(),
      tokenNumber
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update booking (status, date/time, notes)
app.put('/api/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // If rescheduling, check for conflicts
    if (req.body.appointmentDate || req.body.appointmentTime) {
      const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });
      if (booking) {
        const newDate = req.body.appointmentDate || booking.appointmentDate;
        const newTime = req.body.appointmentTime || booking.appointmentTime;

        const conflict = await db.collection('bookings').findOne({
          _id: { $ne: new ObjectId(id) },
          doctorId: booking.doctorId,
          appointmentDate: newDate,
          appointmentTime: newTime,
          status: { $nin: ['Cancelled', 'Rejected'] }
        });

        if (conflict) {
          return res.status(400).json({
            error: 'Time slot already booked for this doctor'
          });
        }
      }
    }

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel appointment
app.put('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: 'Cancelled', updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel appointment by user (soft delete with cancellation status)
app.delete('/api/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          status: 'Cancelled',
          cancelledBy: 'user',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel appointment by clinic admin
app.put('/api/bookings/:id/cancel-by-clinic', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          status: 'Cancelled',
          cancelledBy: 'clinic',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled by clinic successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get bookings by user ID (appointments booked by a specific user)
app.get('/api/bookings/user/:userId', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { userId } = req.params as { userId: string };

    const bookings = await db.collection('bookings')
      .find({ userId })
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .toArray();

    const formatted = await Promise.all(bookings.map(async (booking) => {
      const bookingData: any = {
        id: booking._id.toString(),
        ...booking
      };

      // Fetch clinic details
      try {
        const clinicId = booking.clinicId;
        if (clinicId) {
          let clinic = await db.collection('clinics').findOne({ _id: new ObjectId(clinicId) });
          if (!clinic) {
            clinic = await db.collection('clinicRegistrations').findOne({ _id: new ObjectId(clinicId), status: 'approved' });
          }
          if (clinic) {
            bookingData.clinicDetails = {
              id: clinic._id?.toString?.() || clinic._id,
              name: clinic.name,
              address: clinic.address || '',
              phone: clinic.phone || '',
              email: clinic.email || '',
              specialties: clinic.specialties || [],
              image: clinic.image || '',
              workingHours: clinic.workingHours || ''
            };
          }
        }
      } catch (err) {
        console.error('Error fetching clinic details for booking:', err);
      }

      // Fetch doctor details
      try {
        const doctorId = booking.doctorId;
        if (doctorId) {
          const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
          if (doctor) {
            bookingData.doctorDetails = {
              id: doctor._id?.toString?.() || doctor._id,
              name: doctor.name,
              specialty: doctor.specialty || '',
              email: doctor.email || '',
              experience: doctor.experience || '',
              workingHours: doctor.workingHours || '',
              workingDays: doctor.workingDays || ''
            };
          }
        }
      } catch (err) {
        console.error('Error fetching doctor details for booking:', err);
      }

      return bookingData;
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user bookings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login: Authenticate user and return user data (no password)
app.post('/api/users/login', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { email, password } = req.body;
    const websiteEmail = process.env.WEBSITE_EMAIL || process.env.FROM_EMAIL || 'support@clinicconnect.com';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // First check if user exists in users collection
    let user = await db.collection('users').findOne({ email });

    // If not found in users, check in admins
    if (!user) {
      const admin = await db.collection('admins').findOne({ email });
      if (admin) {
        // Compare password with hash for admin
        const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { passwordHash: _, _id: adminId, ...rest } = admin;
        return res.json({
          message: 'Login successful',
          user: {
            ...rest,
            _id: adminId,
            id: adminId.toString(),
            role: 'Admin', // Explicitly set role
            name: admin.fullName // Map fullName to name
          }
        });
      }

      const deletedUser = await db.collection('deletedUsers').findOne({ email: email.toLowerCase() });
      if (deletedUser) {
        return res.status(403).json({
          error: `Your account has been deleted. Contact website email: ${websiteEmail}`
        });
      }

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: `Your access is revoked. Contact website email: ${websiteEmail}`
      });
    }

    // For existing users, do password comparison
    // (Note: In production, use bcrypt for password comparison)
    if (user.role === 'Clinic Admin') {
      // For clinic admins, check if clinic is approved
      const clinicRegistration = await db
        .collection('clinicRegistrations')
        .findOne({ email });

      if (clinicRegistration) {
        if (clinicRegistration.status === 'pending') {
          return res.status(403).json({
            error: 'Clinic registration is still pending approval. Please wait for admin approval.'
          });
        }
        if (clinicRegistration.status === 'rejected') {
          return res.status(403).json({
            error: 'Clinic registration was rejected. Please contact support.'
          });
        }
      }
    }

    // Check password (compare with hash in production)
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.passwordHash && !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, passwordHash: __, _id: userId, ...rest } = user;
    const id = userId?.toString?.() ?? userId;
    res.json({
      message: 'Login successful',
      user: { ...rest, _id: userId, id }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all users with safe fields (Admin view)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();

    const users = await db
      .collection('users')
      .find({}, { projection: { password: 0, passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    const admins = await db
      .collection('admins')
      .find({}, { projection: { password: 0, passwordHash: 0 } })
      .toArray();

    const clinicRegistrations = await db
      .collection('clinicRegistrations')
      .find({}, { projection: { email: 1, status: 1 } })
      .toArray();

    const clinicStatusByEmail: Record<string, string> = {};
    for (const reg of clinicRegistrations) {
      if (reg.email) clinicStatusByEmail[reg.email.toLowerCase()] = reg.status;
    }

    const formattedUsers = users.map((user: any) => {
      const base = { id: user._id?.toString?.() || user._id, ...user };
      if (user.role === 'Clinic Admin' && user.email) {
        base.clinicStatus = clinicStatusByEmail[user.email.toLowerCase()] || null;
      }
      return base;
    });

    const formattedAdmins = admins.map((admin: any) => ({
      id: admin._id?.toString?.() || admin._id,
      name: admin.fullName || admin.name || 'Admin',
      email: admin.email,
      phone: admin.phone || '',
      role: 'Admin',
      createdAt: admin.createdAt || null,
      updatedAt: admin.updatedAt || null
    }));

    const allUsers = [...formattedUsers, ...formattedAdmins].sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a user (Admin only)
app.delete('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { userId } = req.params as { userId: string };
    if (!ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    if (existingUser.email) {
      await db.collection('deletedUsers').updateOne(
        { email: String(existingUser.email).toLowerCase() },
        {
          $set: {
            email: String(existingUser.email).toLowerCase(),
            deletedAt: new Date(),
            deletedUserId: existingUser._id,
            role: existingUser.role || null,
          },
        },
        { upsert: true }
      );
    }

    const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Revoke user access (set isActive=false)
app.put('/api/users/:userId/revoke', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { userId } = req.params as { userId: string };
    if (!ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke access', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Grant user access (set isActive=true)
app.put('/api/users/:userId/grant', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { userId } = req.params as { userId: string };
    if (!ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isActive: true, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Access granted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grant access', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Send OTP for passwordless auth / reset
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log('[send-otp] Received request for email:', email);
    if (!email) return res.status(400).json({ ok: false, message: 'Email is required' });

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });
    console.log('[send-otp] User found:', !!user);

    // Always respond generically to avoid user enumeration
    const otp = generateOtp();
    console.log('[send-otp] Generated OTP:', otp);
    const hashed = hashOtp(otp);
    const userId = user ? (typeof user._id === 'string' ? user._id : user._id?.toString?.()) : undefined;
    await storeOtp(email, hashed, userId);
    console.log('[send-otp] OTP stored in database');

    if (user) {
      // try to send email, but do not surface errors to caller
      try {
        console.log('[send-otp] Attempting to send email to', email);
        const result = await sendOtpEmail(email, otp, OTP_TTL_MINUTES);
        console.log('[send-otp] Email sent successfully', result);
      } catch (err) {
        console.error('[send-otp] Email send failed for', email, err);
      }
    }

    res.json({ ok: true, message: 'If an account exists, an OTP has been sent.' });
  } catch (err) {
    console.error('[send-otp] Fatal error', err);
    res.status(500).json({ ok: false, message: 'Failed to process request' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ ok: false, message: 'Email and OTP are required' });

    const rec = await getResetRecord(email);
    if (!rec) return res.status(400).json({ ok: false, message: 'Invalid or expired OTP' });

    if (rec.expiresAt && new Date(rec.expiresAt) < new Date()) {
      await deleteReset(email);
      return res.status(400).json({ ok: false, message: 'Invalid or expired OTP' });
    }

    const hashedProvided = hashOtp(otp);
    let matched = false;
    try {
      const a = Buffer.from(hashedProvided);
      const b = Buffer.from(rec.hashedOtp);
      matched = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) {
      matched = false;
    }

    if (!matched) {
      const updated = await incrementAttempts(email);
      if (updated && updated.attempts >= OTP_MAX_ATTEMPTS) {
        await deleteReset(email);
        return res.status(400).json({ ok: false, message: 'Too many attempts. OTP invalidated.' });
      }
      return res.status(400).json({ ok: false, message: 'Invalid or expired OTP' });
    }

    // OTP matched — mark the reset record as verified (do not delete yet)
    await markVerified(email);

    // Optionally, return the user object so frontend can proceed to reset password
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email }, { projection: { password: 0, passwordHash: 0 } });

    return res.json({ ok: true, user, message: 'OTP verified. You may reset your password.' });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ ok: false, message: 'Failed to verify OTP' });
  }
});

// Reset password after OTP verification
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ ok: false, message: 'Email and newPassword are required' });

    const rec = await getResetRecord(email);
    if (!rec || !rec.verified) return res.status(400).json({ ok: false, message: 'OTP not verified or expired' });
    if (rec.expiresAt && new Date(rec.expiresAt) < new Date()) {
      await deleteReset(email);
      return res.status(400).json({ ok: false, message: 'OTP expired' });
    }

    // Update user password (hash) and remove plain-text password field
    const { db } = await connectToDatabase();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updateRes = await db.collection('users').updateOne({ email }, { $set: { passwordHash, updatedAt: new Date() }, $unset: { password: '' } });
    if (updateRes.matchedCount === 0) return res.status(404).json({ ok: false, message: 'User not found' });

    // Consume the reset record
    await deleteReset(email);

    // Return updated user (without passwordHash)
    const user = await db.collection('users').findOne({ email }, { projection: { passwordHash: 0, password: 0 } });
    return res.json({ ok: true, user, message: 'Password reset successful' });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ ok: false, message: 'Failed to reset password' });
  }
});

// Debug: send a test email (development only)
app.post('/api/debug/send-test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email is required' });
    const preview = await sendTestEmail(email);
    return res.json({ ok: true, preview });
  } catch (err) {
    console.error('send-test-email error', err);
    return res.status(500).json({ ok: false, message: 'Failed to send test email' });
  }
});

// Change Password
app.put('/api/users/:userId/change-password', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { userId } = req.params as { userId: string };
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Find user by ID
    let user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    if (user.password && user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (user.passwordHash && !await bcrypt.compare(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password in database
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: newPassword,
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to change password',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Signup: Create a new user account
app.post('/api/users/signup', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const result = await db.collection('users').insertOne({
      name,
      email,
      phone: phone || '',
      password,
      role: role || 'Patient',
      createdAt: new Date()
    });
    res.status(201).json({
      message: 'Account created successfully',
      id: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ====================== CLINIC REGISTRATION ENDPOINTS ======================

// Register a new clinic (creates entry with 'pending' status)
app.post('/api/clinics/register', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { name, email, phone, address, location, specialties, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !phone || !address || !location || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingClinic = await db.collection('clinicRegistrations').findOne({ email });
    if (existingClinic) {
      return res.status(409).json({ error: 'A clinic with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create clinic registration with 'pending' status
    const result = await db.collection('clinicRegistrations').insertOne({
      name,
      email,
      phone,
      address,
      location,
      specialties: Array.isArray(specialties) ? specialties : (specialties ? specialties.split(',').map((s: string) => s.trim()) : []),
      passwordHash: hashedPassword,
      status: 'pending',
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Clinic registration submitted successfully. Awaiting admin approval.',
      id: result.insertedId.toString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to register clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all pending clinic registrations (Admin only)
app.get('/api/clinics/registrations/pending', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const pendingClinics = await db
      .collection('clinicRegistrations')
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = pendingClinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch pending clinics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all approved clinic registrations (Admin only)
app.get('/api/clinics/registrations/approved', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const approvedClinics = await db
      .collection('clinicRegistrations')
      .find({ status: 'approved' })
      .sort({ approvedAt: -1 })
      .toArray();

    const formatted = approvedClinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch approved clinics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all rejected clinic registrations (Admin only)
app.get('/api/clinics/registrations/rejected', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const rejectedClinics = await db
      .collection('clinicRegistrations')
      .find({ status: 'rejected' })
      .sort({ updatedAt: -1 })
      .toArray();

    const formatted = rejectedClinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch rejected clinics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all clinic registrations (any status) (Admin only)
app.get('/api/clinics/registrations', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const clinics = await db
      .collection('clinicRegistrations')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = clinics.map(clinic => ({
      id: clinic._id.toString(),
      ...clinic
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch clinic registrations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Approve clinic registration (Admin only)
app.put('/api/clinics/registrations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    // Find the clinic registration
    const clinic = await db
      .collection('clinicRegistrations')
      .findOne({ _id: new ObjectId(String(id)) });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic registration not found' });
    }

    if (clinic.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve a ${clinic.status} clinic` });
    }

    // Update clinic registration status to 'approved'
    await db.collection('clinicRegistrations').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create clinic admin user account for login
    const clinicAdminResult = await db.collection('users').insertOne({
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone,
      passwordHash: clinic.passwordHash,
      role: 'Clinic Admin',
      clinicId: id,
      createdAt: new Date()
    });

    // Create clinic profile in clinics collection for directory listing
    await db.collection('clinics').insertOne({
      _id: new ObjectId(id),
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone,
      address: clinic.address || '',
      location: clinic.location || '',
      specialties: clinic.specialties || [],
      description: clinic.description || '',
      image: clinic.image || '',
      workingHours: clinic.workingHours || '',
      rating: 0,
      clinicAdminId: clinicAdminResult.insertedId.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Clinic ${clinic.name} approved and created in clinics collection`);

    res.json({
      message: 'Clinic registration approved successfully',
      clinicAdminId: clinicAdminResult.insertedId.toString()
    });
  } catch (error) {
    console.error('Error approving clinic:', error);
    res.status(500).json({
      error: 'Failed to approve clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reject clinic registration (Admin only)
app.put('/api/clinics/registrations/:id/reject', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    // Find the clinic registration
    const clinic = await db
      .collection('clinicRegistrations')
      .findOne({ _id: new ObjectId(String(id)) });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic registration not found' });
    }

    if (clinic.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject a ${clinic.status} clinic` });
    }

    // Update clinic registration status to 'rejected'
    await db.collection('clinicRegistrations').updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason || 'No reason provided',
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: 'Clinic registration rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reject clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Revoke clinic approval (Admin only)
app.put('/api/clinics/registrations/:id/revoke', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    // Find the clinic registration
    const clinic = await db
      .collection('clinicRegistrations')
      .findOne({ _id: new ObjectId(String(id)) });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic registration not found' });
    }

    if (clinic.status !== 'approved') {
      return res.status(400).json({ error: `Cannot revoke a ${clinic.status} clinic` });
    }

    // Update clinic registration status back to 'pending'
    await db.collection('clinicRegistrations').updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          status: 'pending',
          approvedAt: null,
          revocationReason: reason || 'No reason provided',
          updatedAt: new Date()
        }
      }
    );

    // Delete the clinic admin user account created during approval
    if (clinic.email) {
      await db.collection('users').deleteOne({
        email: clinic.email,
        role: 'Clinic Admin'
      });
    }

    // Delete clinic from clinics collection
    await db.collection('clinics').deleteOne({ _id: new ObjectId(id) });

    res.json({
      message: 'Clinic approval revoked successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to revoke clinic approval',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete Clinic
app.delete('/api/clinics/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    // Find the clinic registration
    const clinic = await db
      .collection('clinicRegistrations')
      .findOne({ _id: new ObjectId(String(id)) });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic registration not found' });
    }

    // Delete the clinic admin user account
    if (clinic.email) {
      await db.collection('users').deleteOne({
        email: clinic.email,
        role: 'Clinic Admin'
      });
    }

    // Delete all doctors associated with this clinic
    await db.collection('doctors').deleteMany({
      clinicId: id
    });

    // Delete all bookings associated with this clinic
    await db.collection('bookings').deleteMany({
      clinicId: id
    });

    // Delete clinic from clinics collection
    await db.collection('clinics').deleteOne({ _id: new ObjectId(String(id)) });

    // Delete the clinic registration
    await db.collection('clinicRegistrations').deleteOne({
      _id: new ObjectId(String(id))
    });

    res.json({
      message: 'Clinic deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete clinic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get clinic registration by ID
app.get('/api/clinics/registrations/:id', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    const clinic = await db
      .collection('clinicRegistrations')
      .findOne({ _id: new ObjectId(String(id)) });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic registration not found' });
    }

    res.json({
      id: clinic._id.toString(),
      ...clinic
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch clinic registration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ====================== ADMIN ENDPOINTS ======================

// Admin Login: Authenticate admin from admins collection
app.post('/api/admins/login', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin by email
    const admin = await db.collection('admins').findOne({ email });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { passwordHash: _, _id: adminId, ...rest } = admin;
    res.json({
      message: 'Admin login successful',
      admin: { ...rest, _id: adminId, id: adminId.toString() }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Admin login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create Admin Account (for admin creation/registration)
app.post('/api/admins/create', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: 'An admin account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin document
    const result = await db.collection('admins').insertOne({
      fullName,
      email,
      passwordHash,
      createdAt: new Date(),
      isActive: true
    });

    res.status(201).json({
      message: 'Admin account created successfully',
      id: result.insertedId.toString(),
      admin: {
        id: result.insertedId.toString(),
        fullName,
        email,
        isActive: true,
        createdAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create admin account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all admins (for admin management - requires authentication in production)
app.get('/api/admins', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const admins = await db
      .collection('admins')
      .find({})
      .project({ passwordHash: 0 })
      .toArray();

    const formatted = admins.map(admin => ({
      id: admin._id.toString(),
      ...admin
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch admins',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: 'Name, email, and message are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid email address'
      });
    }

    // Send the contact email
    await sendContactEmail(name, email, message);

    res.json({
      ok: true,
      message: 'Thank you for contacting us! We will get back to you soon.'
    });
  } catch (err) {
    console.error('[contact] Error sending contact email:', err);
    res.status(500).json({
      ok: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// Chatbot endpoint
// Chatbot endpoint
app.post('/api/chatbot', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        message: 'Message is required'
      });
    }

    // Connect to DB to fetch context
    const { db } = await connectToDatabase();

    // Fetch clinics (including approved registrations)
    const clinics = await db.collection('clinics').find({}).toArray();
    const approvedRegistrations = await db.collection('clinicRegistrations').find({ status: 'approved' }).toArray();

    // Combine clinics
    const allClinics = [...clinics];
    const clinicIds = new Set(clinics.map(c => c._id.toString()));
    for (const reg of approvedRegistrations) {
      if (!clinicIds.has(reg._id.toString())) {
        allClinics.push(reg);
      }
    }

    // Fetch doctors
    const doctors = await db.collection('doctors').find({}).toArray();

    // Format context data
    let contextData = "Here is the list of available clinics and doctors:\n\n";

    contextData += "CLINICS:\n";
    allClinics.forEach(clinic => {
      contextData += `- Name: ${clinic.name}\n`;
      contextData += `  Location: ${clinic.location}\n`;
      contextData += `  Specialties: ${clinic.specialties ? clinic.specialties.join(', ') : 'General'}\n`;
      contextData += `  Working Hours: ${clinic.workingHours || 'Not specified'}\n`;
      contextData += `  Description: ${clinic.description || 'N/A'}\n\n`;
    });

    contextData += "DOCTORS:\n";
    doctors.forEach(doc => {
      // Find clinic name for doctor
      const clinic = allClinics.find(c => c._id.toString() === doc.clinicId);
      const clinicName = clinic ? clinic.name : 'Unknown Clinic';

      contextData += `- Name: ${doc.name}\n`;
      contextData += `  Specialization: ${doc.specialization}\n`;
      contextData += `  Experience: ${doc.experience} years\n`;
      contextData += `  Clinic: ${clinicName}\n\n`;
    });

    // Get response from chatbot service
    const reply = await getChatbotResponse(message, contextData);

    res.json({
      ok: true,
      reply
    });
  } catch (err) {
    console.error('[chatbot] Error processing chatbot request:', err);
    res.status(500).json({
      ok: false,
      message: 'Failed to process chatbot request'
    });
  }
});

// Check and send appointment reminders (for appointments 24 hours from now)
// This can be called manually or by a scheduled job (e.g., cron job)
app.post('/api/appointments/send-reminders', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    
    // Get current date/time
    const now = new Date();
    
    // Calculate tomorrow's date (24 hours from now)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format tomorrow's date as YYYY-MM-DD for comparison
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`[Reminders] Checking for appointments on ${tomorrowDateStr}`);
    
    // Find all appointments scheduled for tomorrow that haven't been reminded yet
    const appointmentsToRemind = await db.collection('bookings')
      .find({
        appointmentDate: tomorrowDateStr,
        status: { $nin: ['Cancelled', 'Rejected'] },
        reminderSent: { $ne: true }
      })
      .toArray();
    
    console.log(`[Reminders] Found ${appointmentsToRemind.length} appointments to remind`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send reminder emails for each appointment
    for (const appointment of appointmentsToRemind) {
      try {
        // Skip if no patient email
        if (!appointment.patientEmail) {
          console.log(`[Reminders] Skipping appointment ${appointment._id} - no email`);
          continue;
        }
        
        // Fetch clinic and doctor details
        let clinic = await db.collection('clinics').findOne({ _id: new ObjectId(String(appointment.clinicId)) });
        if (!clinic) {
          clinic = await db.collection('clinicRegistrations').findOne({ 
            _id: new ObjectId(String(appointment.clinicId)), 
            status: 'approved' 
          });
        }
        
        let doctor = await db.collection('doctors').findOne({ _id: new ObjectId(String(appointment.doctorId)) });
        
        const clinicName = clinic?.name || 'Clinic';
        const doctorName = doctor?.name || 'Doctor';
        const clinicAddress = clinic?.address || clinic?.location || '';
        const clinicPhone = clinic?.phone || '';
        
        // Send reminder email
        await sendAppointmentReminderEmail(
          appointment.patientEmail,
          appointment.patientName,
          clinicName,
          doctorName,
          appointment.appointmentDate,
          appointment.appointmentTime,
          appointment.tokenNumber,
          clinicAddress,
          clinicPhone
        );
        
        // Mark appointment as reminder sent
        await db.collection('bookings').updateOne(
          { _id: new ObjectId(appointment._id) },
          { $set: { reminderSent: true, reminderSentAt: new Date() } }
        );
        
        console.log(`[Reminders] Reminder sent for appointment ${appointment._id}`);
        sentCount++;
      } catch (err) {
        console.error(`[Reminders] Failed to send reminder for appointment ${appointment._id}:`, err);
        failedCount++;
      }
    }
    
    res.json({
      message: 'Reminder job completed',
      total: appointmentsToRemind.length,
      sent: sentCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('[Reminders] Error in reminder job:', error);
    res.status(500).json({
      error: 'Failed to process reminders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual endpoint to send a reminder for a specific appointment (for testing)
app.post('/api/appointments/:id/send-reminder', async (req: Request, res: Response) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.params as { id: string };
    
    if (!ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    const appointment = await db.collection('bookings').findOne({ _id: new ObjectId(String(id)) });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.patientEmail) {
      return res.status(400).json({ error: 'Patient email not found' });
    }
    
    // Fetch clinic and doctor details
    let clinic = await db.collection('clinics').findOne({ _id: new ObjectId(String(appointment.clinicId)) });
    if (!clinic) {
      clinic = await db.collection('clinicRegistrations').findOne({ 
        _id: new ObjectId(String(appointment.clinicId)), 
        status: 'approved' 
      });
    }
    
    let doctor = await db.collection('doctors').findOne({ _id: new ObjectId(String(appointment.doctorId)) });
    
    const clinicName = clinic?.name || 'Clinic';
    const doctorName = doctor?.name || 'Doctor';
    const clinicAddress = clinic?.address || clinic?.location || '';
    const clinicPhone = clinic?.phone || '';
    
    // Send reminder email
    await sendAppointmentReminderEmail(
      appointment.patientEmail,
      appointment.patientName,
      clinicName,
      doctorName,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.tokenNumber,
      clinicAddress,
      clinicPhone
    );
    
    // Mark appointment as reminder sent
    await db.collection('bookings').updateOne(
      { _id: new ObjectId(appointment._id) },
      { $set: { reminderSent: true, reminderSentAt: new Date() } }
    );
    
    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('[Reminder] Error sending reminder:', error);
    res.status(500).json({
      error: 'Failed to send reminder',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test health endpoint: http://localhost:${PORT}/api/health`);
});

// Schedule appointment reminders to run daily at 10:00 AM
cron.schedule('0 10 * * *', async () => {
  try {
    console.log('[Scheduler] Running scheduled appointment reminders...');
    
    const { db } = await connectToDatabase();
    
    // Get current date/time
    const now = new Date();
    
    // Calculate tomorrow's date (24 hours from now)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format tomorrow's date as YYYY-MM-DD for comparison
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`[Scheduler] Checking for appointments on ${tomorrowDateStr}`);
    
    // Find all appointments scheduled for tomorrow that haven't been reminded yet
    const appointmentsToRemind = await db.collection('bookings')
      .find({
        appointmentDate: tomorrowDateStr,
        status: { $nin: ['Cancelled', 'Rejected'] },
        reminderSent: { $ne: true }
      })
      .toArray();
    
    console.log(`[Scheduler] Found ${appointmentsToRemind.length} appointments to remind`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send reminder emails for each appointment
    for (const appointment of appointmentsToRemind) {
      try {
        // Skip if no patient email
        if (!appointment.patientEmail) {
          console.log(`[Scheduler] Skipping appointment ${appointment._id} - no email`);
          continue;
        }
        
        // Fetch clinic and doctor details
        let clinic = await db.collection('clinics').findOne({ _id: new ObjectId(String(appointment.clinicId)) });
        if (!clinic) {
          clinic = await db.collection('clinicRegistrations').findOne({ 
            _id: new ObjectId(String(appointment.clinicId)), 
            status: 'approved' 
          });
        }
        
        let doctor = await db.collection('doctors').findOne({ _id: new ObjectId(String(appointment.doctorId)) });
        
        const clinicName = clinic?.name || 'Clinic';
        const doctorName = doctor?.name || 'Doctor';
        const clinicAddress = clinic?.address || clinic?.location || '';
        const clinicPhone = clinic?.phone || '';
        
        // Send reminder email
        await sendAppointmentReminderEmail(
          appointment.patientEmail,
          appointment.patientName,
          clinicName,
          doctorName,
          appointment.appointmentDate,
          appointment.appointmentTime,
          appointment.tokenNumber,
          clinicAddress,
          clinicPhone
        );
        
        // Mark appointment as reminder sent
        await db.collection('bookings').updateOne(
          { _id: new ObjectId(appointment._id) },
          { $set: { reminderSent: true, reminderSentAt: new Date() } }
        );
        
        console.log(`[Scheduler] Reminder sent for appointment ${appointment._id}`);
        sentCount++;
      } catch (err) {
        console.error(`[Scheduler] Failed to send reminder for appointment ${appointment._id}:`, err);
        failedCount++;
      }
    }
    
    console.log(`[Scheduler] Reminder job completed - Total: ${appointmentsToRemind.length}, Sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error('[Scheduler] Error in scheduled reminder job:', error);
  }
});

console.log('[Scheduler] Appointment reminder job scheduled to run daily at 10:00 AM (0 10 * * *)');
