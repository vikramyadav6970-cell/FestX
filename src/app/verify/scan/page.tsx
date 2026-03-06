'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Logo } from '@/components/common/Logo';
import Link from 'next/link';
import {
  QrCode,
  ArrowLeft,
  Camera,
  CameraOff,
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function PublicVerifyScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setIsStarting(true);
      
      // IMPORTANT: Div must be visible for library to calculate size
      setIsScanning(true);
      
      // Delay slightly to ensure DOM has updated and 'hidden' class is gone
      await new Promise(resolve => setTimeout(resolve, 300));

      const html5QrCode = new Html5Qrcode("qr-reader-public");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => { /* ignore silent frame errors */ }
      );

      setIsStarting(false);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setIsScanning(false);
      setIsStarting(false);
      setError('Could not access camera. Please ensure you have granted permission.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (error) {
        console.error('Scanner stop error:', error);
      }
    }
    setIsScanning(false);
    setIsStarting(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    let code = decodedText;
    if (decodedText.includes('/verify/')) {
      code = decodedText.split('/verify/').pop()?.split('?')[0] || decodedText;
    }
    router.push(`/verify/${code}`);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      router.push(`/verify/${manualCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/">
            <Logo size="large" className="justify-center" />
          </Link>
          <h1 className="mt-6 text-3xl font-bold font-headline">Verify Certificate</h1>
          <p className="text-muted-foreground mt-2">Scan or enter ID to verify authenticity</p>
        </div>

        <Card className="shadow-xl border-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-500" />
              Scanner
            </CardTitle>
            <CardDescription>Point your camera at the QR code on the certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* The scanner element wrapper to avoid React removeChild issues */}
            <div 
              className={`relative w-full aspect-square bg-black rounded-xl overflow-hidden ${!isScanning ? 'hidden' : ''}`}
            >
              {/* Dedicated mount point for library */}
              <div id="qr-reader-public" className="w-full h-full" />

              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Initializing camera...</p>
                </div>
              )}
            </div>

            {!isScanning && (
              <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <Button onClick={startScanner} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Launch Camera
                </Button>
              </div>
            )}

            {isScanning && (
              <Button onClick={stopScanner} variant="destructive" className="w-full">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Scanner
              </Button>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Or manual entry</span>
              </div>
            </div>

            <form onSubmit={handleManualVerify} className="flex gap-2">
              <Input
                placeholder="FESTX-CERT-..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="uppercase font-mono"
              />
              <Button type="submit" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}