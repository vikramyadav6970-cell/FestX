
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Event as EventType, Registration, Certificate, CertificateTemplate } from '@/types';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  Award,
  Download,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Eye,
  RefreshCw,
  Mail,
  Palette,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

export default function CertificateManagementPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<EventType | null>(null);
  const [template, setTemplate] = useState<any | null>(null);
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch event
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as EventType);
      }

      // Fetch templates for this event
      const templatesQuery = query(collection(db, 'certificateTemplates'), where('eventId', '==', eventId));
      const templatesSnapshot = await getDocs(templatesQuery);
      if (!templatesSnapshot.empty) {
        setTemplate({ id: templatesSnapshot.docs[0].id, ...templatesSnapshot.docs[0].data() });
      }

      // Fetch attended registrations
      const regsQuery = query(
        collection(db, 'registrations'), 
        where('eventId', '==', eventId),
        where('attended', '==', true)
      );
      const regsSnapshot = await getDocs(regsQuery);
      const eventRegs = regsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registration[];
      setAttendees(eventRegs);

      // Fetch issued certificates
      const certsQuery = query(collection(db, 'certificates'), where('eventId', '==', eventId));
      const certsSnapshot = await getDocs(certsQuery);
      const eventCerts = certsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Certificate[];
      setCertificates(eventCerts);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load certificate data.' });
    } finally {
      setLoading(false);
    }
  };

  const generateVerificationCode = () => {
    return 'FESTX-CERT-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateCertificates = async () => {
    if (!template) {
      toast({ variant: 'destructive', title: 'Template Required', description: 'Please design a certificate template first.' });
      return;
    }

    const toGenerate = selectedAttendees.length > 0 
      ? attendees.filter(a => selectedAttendees.includes(a.id))
      : attendees;

    if (toGenerate.length === 0) {
      toast({ variant: 'destructive', title: 'No Selection', description: 'Please select attendees to generate certificates for.' });
      return;
    }

    const existingUserIds = certificates.map(c => c.userId);
    const newAttendees = toGenerate.filter(a => !existingUserIds.includes(a.userId));

    if (newAttendees.length === 0) {
      toast({ title: 'Already Issued', description: 'All selected attendees already have certificates.' });
      return;
    }

    setGenerating(true);
    try {
      const batch = writeBatch(db);
      
      for (const attendee of newAttendees) {
        const verificationCode = generateVerificationCode();
        const certRef = doc(collection(db, 'certificates'));
        
        const certificateData = {
          eventId: eventId,
          eventTitle: event?.title || 'Event',
          userId: attendee.userId,
          userName: attendee.userName,
          userEmail: attendee.userEmail,
          userRollNo: attendee.userRollNo,
          templateId: template.id,
          issuedBy: currentUser?.uid,
          issuedByName: userProfile?.name || 'Organizer',
          issuedAt: serverTimestamp(),
          verificationCode: verificationCode,
          verificationUrl: `${window.location.origin}/verify/${verificationCode}`,
          status: 'issued',
          downloadCount: 0,
          notified: false
        };

        batch.set(certRef, certificateData);
      }

      await batch.commit();
      toast({ title: 'Success', description: `Generated ${newAttendees.length} certificate(s).` });
      await fetchData();
      setSelectedAttendees([]);
    } catch (error) {
      console.error('Error generating certificates:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate certificates.' });
    } finally {
      setGenerating(false);
    }
  };

  const notifyStudents = async () => {
    const unnotifiedCerts = certificates.filter(c => !c.notified);
    
    if (unnotifiedCerts.length === 0) {
      toast({ title: 'All Notified', description: 'All students have already been notified.' });
      return;
    }

    setNotifying(true);
    try {
      const batch = writeBatch(db);
      
      for (const cert of unnotifiedCerts) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          title: '🎓 Your Certificate is Ready!',
          message: `Your participation certificate for "${event?.title}" is now available for download.`,
          targetType: 'specific-user',
          targetUserId: cert.userId,
          targetEventId: eventId,
          senderId: currentUser?.uid,
          senderName: userProfile?.name || 'Organizer',
          senderRole: 'organizer',
          readBy: [],
          createdAt: serverTimestamp()
        });

        const certDocRef = doc(db, 'certificates', cert.id);
        batch.update(certDocRef, {
          notified: true,
          notifiedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast({ title: 'Success', description: `Notified ${unnotifiedCerts.length} student(s).` });
      await fetchData();
    } catch (error) {
      console.error('Error notifying students:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send notifications.' });
    } finally {
      setNotifying(false);
    }
  };

  const downloadCertificatePDF = async (certificate: Certificate) => {
    try {
      setPreviewCertificate(certificate);
      
      // Delay to allow hidden render
      await new Promise(resolve => setTimeout(resolve, 800));

      const element = certificateRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${certificate.userName.replace(/\s+/g, '_')}_Certificate.pdf`);

      setPreviewCertificate(null);
      
      // Update download count (optional)
      const certRef = doc(db, 'certificates', certificate.id);
      updateDoc(certRef, { 
        downloadCount: (certificate.downloadCount || 0) + 1,
        lastDownloadedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate PDF.' });
    }
  };

  const toggleSelectAttendee = (id: string) => {
    setSelectedAttendees(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAttendees.length === attendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(attendees.map(a => a.id));
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificate Manager</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/organizer/event/${eventId}/certificate-designer`}>
            <Palette className="w-4 h-4 mr-2" /> Designer
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{attendees.length}</p>
            <p className="text-xs text-muted-foreground">Attended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Award className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{certificates.length}</p>
            <p className="text-xs text-muted-foreground">Issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Mail className="w-8 h-8 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{certificates.filter(c => c.notified).length}</p>
            <p className="text-xs text-muted-foreground">Notified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Download className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">
              {certificates.reduce((acc, c) => acc + (c.downloadCount || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Downloads</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-xl">
        {!template ? (
          <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
            <Link href={`/organizer/event/${eventId}/certificate-designer`}>
              <Plus className="w-4 h-4 mr-2" /> Create First Template
            </Link>
          </Button>
        ) : (
          <>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={generateCertificates}
              disabled={generating || attendees.length === 0}
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
              Generate {selectedAttendees.length > 0 ? `Selected (${selectedAttendees.length})` : 'All'}
            </Button>
            <Button 
              variant="secondary"
              onClick={notifyStudents}
              disabled={notifying || certificates.length === 0}
            >
              {notifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Notify Students
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Event Attendees</CardTitle>
            <Button variant="link" size="sm" onClick={toggleSelectAll}>
              {selectedAttendees.length === attendees.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No attendees marked yet for this event.
                  </TableCell>
                </TableRow>
              ) : (
                attendees.map(attendee => {
                  const cert = certificates.find(c => c.userId === attendee.userId);
                  const isIssued = !!cert;
                  
                  return (
                    <TableRow key={attendee.id} className={isIssued ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedAttendees.includes(attendee.id)}
                          onCheckedChange={() => toggleSelectAttendee(attendee.id)}
                          disabled={isIssued}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{attendee.userName}</div>
                        <div className="text-xs text-muted-foreground">{attendee.userEmail}</div>
                      </TableCell>
                      <TableCell>{attendee.userRollNo}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isIssued ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" /> Issued
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                          )}
                          {cert?.notified && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Notified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {cert && (
                          <Button variant="ghost" size="icon" onClick={() => downloadCertificatePDF(cert)} title="Download PDF">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden Render Container for PDF Generation */}
      {previewCertificate && template && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div
            ref={certificateRef}
            style={{
              width: '1123px', // A4 landscape pixels at 96dpi
              height: '794px',
              backgroundColor: template.backgroundColor,
              backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: `${template.borderWidth}px solid ${template.borderColor}`,
              position: 'relative'
            }}
          >
            {template.elements.map((element: any) => (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  transform: element.align === 'center' ? 'translateX(-50%)' : 'none'
                }}
              >
                {element.type === 'qrcode' ? (
                  <div className="bg-white p-2 rounded shadow-sm">
                    <QRCode
                      value={previewCertificate.verificationCode}
                      size={element.size || 60}
                    />
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      color: element.color,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {element.type === 'dynamic'
                      ? element.field === 'participantName' ? previewCertificate.userName
                        : element.field === 'eventName' ? previewCertificate.eventTitle
                        : element.field === 'date' ? formatDate(event?.date)
                        : element.field === 'organizerName' ? previewCertificate.issuedByName
                        : element.placeholder
                      : element.content
                    }
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
