
'use client';
import type { Registration } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';
import { useRef } from 'react';

interface QRCodeDialogProps {
    registration: Registration;
    children: React.ReactNode;
}

const getQRValue = (reg: Registration) => {
    if (reg.qrCode) return reg.qrCode;
    return reg.id;
};

export function QRCodeDialog({ registration, children }: QRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrValue = getQRValue(registration);
  
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.download = `${registration.eventTitle}-QRCode.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{registration.eventTitle}</DialogTitle>
          <DialogDescription>
            Show this QR code at the event for check-in.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex flex-col items-center justify-center gap-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
             {qrValue && <QRCode value={qrValue} size={256} />}
          </div>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
