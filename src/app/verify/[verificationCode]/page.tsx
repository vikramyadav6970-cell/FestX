'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Logo } from '@/components/common/Logo';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  User,
  Building,
  Loader2,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Printer,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Certificate } from '@/types';

export default function VerifyCertificatePage() {
  const params = useParams();
  const verificationCode = params.verificationCode as string;
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (verificationCode) {
      verifyCertificate();
    }
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      const certsRef = collection(db, 'certificates');
      const q = query(certsRef, where('verificationCode', '==', verificationCode));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const certData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Certificate;
        
        if (certData.status === 'revoked') {
          setError('This certificate has been revoked and is no longer valid.');
        } else {
          setCertificate(certData);
        }
      } else {
        setError('Certificate not found');
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify certificate. Please try again later.');
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

  const handlePrintPDF = async () => {
    if (!certificate || !printRef.current) return;
    
    try {
      setIsPrinting(true);
      
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Ensure we capture the full scroll height
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Verification_${certificate.verificationCode}.pdf`);
      
      toast({
        title: "Success",
        description: "Verification PDF generated successfully."
      });
    } catch (err) {
      console.error('PDF Generation error:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate verification PDF."
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo size="large" />
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden border border-border">
          
          {/* We wrap the content in a div with print-specific padding to avoid cut-off */}
          <div ref={printRef} className="bg-card pb-12">
            {/* Status Header */}
            <div className={`p-6 text-white text-center transition-colors duration-500 ${
              loading ? 'bg-muted' :
              certificate ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              'bg-gradient-to-r from-red-500 to-rose-600'
            }`}>
              <div className="flex flex-col items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                ) : certificate ? (
                  <ShieldCheck className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
                <h1 className="text-2xl font-bold font-headline">
                  {loading ? 'Verifying Authenticity...' :
                   certificate ? 'Verified Certificate' :
                   'Verification Failed'}
                </h1>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground animate-pulse">Securing verified record...</p>
                </div>
              ) : certificate ? (
                <div className="space-y-8">
                  
                  {/* Success Banner */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 dark:text-green-400 font-semibold">
                      Authentic document issued by FestX Platform
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Issued To</p>
                        <p className="font-bold text-foreground text-lg">
                          {certificate.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">{certificate.userEmail}</p>
                        {certificate.userRollNo && (
                          <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 mt-1">Roll: {certificate.userRollNo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Achievement</p>
                        <p className="font-bold text-foreground text-lg">
                          {certificate.eventTitle}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-xl border border-border">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Date</p>
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          {formatDate(certificate.issuedAt)}
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl border border-border">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Issuer</p>
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Building className="w-4 h-4 text-indigo-500" />
                          {certificate.issuedByName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secure ID */}
                  <div className="text-center pt-6 border-t border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Digital ID</p>
                    <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 rounded-full inline-block border border-indigo-100 dark:border-indigo-900">
                      {certificate.verificationCode}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Invalid Record
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    The verification code <span className="font-mono text-destructive">"{verificationCode}"</span> does not correspond to a valid record.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer - Not captured in PDF */}
          <div className="px-8 py-6 bg-muted/30 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              {certificate && (
                <Button 
                  onClick={handlePrintPDF} 
                  variant="outline" 
                  className="w-full"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Print PDF
                </Button>
              )}
              <Button asChild className={`w-full ${!certificate ? 'col-span-2' : ''}`}>
                <Link href="/">
                  Home Page
                </Link>
              </Button>
            </div>
            <div className="mt-4">
              <Button variant="ghost" asChild className="w-full">
                <Link href="/verify/scan">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Scan Another
                </Link>
              </Button>
            </div>
          </div>

        </div>

        {/* Footer Credits */}
        <p className="text-center text-muted-foreground text-xs mt-8 font-medium">
          FestX Engine &bull; © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
