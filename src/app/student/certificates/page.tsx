'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, increment, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Award,
  Download,
  Calendar,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Certificate, CertificateTemplate, Event } from '@/types';

export default function MyCertificatesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Record<string, CertificateTemplate>>({});
  const [events, setEvents] = useState<Record<string, Event>>({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCertificates();
    }
  }, [currentUser]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      // Fetch certificates for the current user
      const certsQuery = query(
        collection(db, 'certificates'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'issued')
      );
      const certsSnapshot = await getDocs(certsQuery);
      const myCerts = certsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Certificate[];
      setCertificates(myCerts);

      if (myCerts.length > 0) {
        // Fetch templates
        const templatesSnapshot = await getDocs(collection(db, 'certificateTemplates'));
        const templatesMap: Record<string, CertificateTemplate> = {};
        templatesSnapshot.docs.forEach(doc => {
          templatesMap[doc.id] = { id: doc.id, ...doc.data() } as CertificateTemplate;
        });
        setTemplates(templatesMap);

        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const eventsMap: Record<string, Event> = {};
        eventsSnapshot.docs.forEach(doc => {
          eventsMap[doc.id] = { id: doc.id, ...doc.data() } as Event;
        });
        setEvents(eventsMap);
      }

    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load certificates.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const downloadCertificate = async (certificate: Certificate) => {
    const template = templates[certificate.templateId];
    if (!template) {
      toast({ variant: 'destructive', title: 'Error', description: 'Certificate template not found.' });
      return;
    }

    setDownloading(certificate.id);
    setPreviewCert(certificate);

    try {
      // Small delay to ensure the hidden element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 800));

      const element = certificateRef.current;
      if (!element) throw new Error("Certificate element not found");

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
      pdf.save(`Certificate_${certificate.eventTitle.replace(/\s+/g, '_')}.pdf`);

      // Update download count in Firestore
      try {
        await updateDoc(doc(db, 'certificates', certificate.id), {
          downloadCount: increment(1),
          lastDownloadedAt: serverTimestamp()
        });
      } catch (dbError) {
        // Log database error but don't fail the UI if PDF was already saved
        console.warn('Failed to update download statistics:', dbError);
      }

      setPreviewCert(null);
      toast({ title: 'Success', description: 'Certificate downloaded successfully.' });

    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({ variant: 'destructive', title: 'Download Failed', description: 'An unexpected error occurred while generating the PDF.' });
    } finally {
      setDownloading(null);
    }
  };

  const openVerificationPage = (verificationCode: string) => {
    window.open(`/verify/${verificationCode}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Award className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">My Certificates</h1>
            <p className="text-amber-100 mt-1">Access and download your verified achievement records</p>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="border-dashed py-20">
          <CardContent className="flex flex-col items-center text-center">
            <Award className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold">No Certificates Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Participate in more events to build your collection of digital certificates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <Card
              key={cert.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-border/50"
            >
              {/* Preview Area */}
              <div className="h-44 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center relative">
                <Award className="w-24 h-24 text-indigo-500/40 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 bg-white dark:bg-slate-900 rounded-full shadow-sm" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                    {cert.eventTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issued {formatDate(cert.issuedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadCertificate(cert)}
                    disabled={downloading === cert.id}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-11"
                  >
                    {downloading === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => openVerificationPage(cert.verificationCode)}
                    title="Verify online"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] font-mono text-center text-muted-foreground uppercase tracking-wider">
                    ID: {cert.verificationCode}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden Container for PDF Generation */}
      {previewCert && templates[previewCert.templateId] && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div
            ref={certificateRef}
            style={{
              width: '1123px', // A4 Landscape
              height: '794px',
              backgroundColor: templates[previewCert.templateId].backgroundColor,
              backgroundImage: templates[previewCert.templateId].backgroundImage 
                ? `url(${templates[previewCert.templateId].backgroundImage})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: `${templates[previewCert.templateId].borderWidth || 10}px solid ${templates[previewCert.templateId].borderColor || '#6366f1'}`,
              position: 'relative'
            }}
          >
            {(templates[previewCert.templateId].elements || []).map((element: any) => (
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
                  <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
                    <QRCode
                      value={previewCert.verificationCode}
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
                      ? element.field === 'participantName' ? previewCert.userName
                        : element.field === 'eventName' ? previewCert.eventTitle
                        : element.field === 'date' ? formatDate(events[previewCert.eventId]?.date)
                        : element.field === 'organizerName' ? previewCert.issuedByName
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