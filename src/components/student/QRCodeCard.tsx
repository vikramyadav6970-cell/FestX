
'use client';
import type { Registration } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, XCircle, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface QRCodeCardProps {
  registration: Registration;
}

const getQRValue = (reg: Registration) => {
    if (reg.qrCode) return reg.qrCode;
    return reg.id;
};


export function QRCodeCard({ registration }: QRCodeCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrValue = getQRValue(registration);

  const getStatus = () => {
    const eventDate = new Date(registration.eventDate);
    if (registration.attended) return { text: 'Used', color: 'bg-gray-500', icon: <CheckCircle2 /> };
    if (isPast(eventDate) && !isToday(eventDate)) return { text: 'Expired', color: 'bg-red-500', icon: <XCircle /> };
    return { text: 'Valid', color: 'bg-green-500', icon: <Clock /> };
  };

  const status = getStatus();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 256, 256);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${registration.eventTitle}-QRCode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };


  return (
    <Card className="flex flex-col items-center text-center overflow-hidden transition-shadow duration-300 hover:shadow-lg cursor-pointer">
      <CardHeader className="w-full p-0">
          <div ref={qrRef} className="bg-white p-4 transition-opacity">
              <QRCode value={qrValue} size={256} viewBox={`0 0 256 256`} className="h-auto w-full" />
          </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow w-full">
        <CardTitle className="text-base font-bold leading-tight">{registration.eventTitle}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(registration.eventDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
        </p>
        <Badge className={cn("mt-2 text-white", status.color)}>
            {status.icon}
            <span className="ml-1.5">{status.text}</span>
        </Badge>
      </CardContent>
      <CardFooter className="w-full p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
