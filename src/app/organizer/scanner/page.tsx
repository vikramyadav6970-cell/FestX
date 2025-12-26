'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Search, 
  Users,
  AlertTriangle,
  RefreshCw,
  Camera,
  CameraOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const ScannerPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<{ type: string; title: string; message: string; student?: any } | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({ total: 0, attended: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchEvents();
    return () => {
      stopScanner();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    if (!currentUser?.uid) return;
    try {
      const q = query(
        collection(db, 'events'),
        where('organizerId', '==', currentUser.uid),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedEventId) return;
    try {
      const q = query(collection(db, 'registrations'), where('eventId', '==', selectedEventId));
      const snapshot = await getDocs(q);
      const eventRegs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setRegistrations(eventRegs);
      setStats({
        total: eventRegs.length,
        attended: eventRegs.filter(r => r.attended === true).length
      });
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };
  
  const playSound = (type: 'success' | 'warning' | 'error') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'success') {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
      } else if (type === 'warning') {
        oscillator.frequency.value = 400;
        oscillator.type = 'triangle';
      } else {
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
      }

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const startScanner = async () => {
    if (!selectedEventId) {
      setMessage({ text: 'Please select an event first!', type: 'error' });
      return;
    }

    try {
      setScanResult(null);
      setMessage({ text: '', type: '' });
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        (errorMessage) => { /* ignore */ }
      );

      setIsScanning(true);
      setMessage({ text: '📷 Camera active - Point at QR code', type: 'info' });

    } catch (error) {
      console.error('Error starting scanner:', error);
      setMessage({ 
        text: 'Failed to start camera. Please allow camera permissions.', 
        type: 'error' 
      });
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (error) {
        console.log('Scanner stop error:', error);
      }
    }
    setIsScanning(false);
  };
  
  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    await processQRCode(decodedText);
  };

  const processQRCode = async (qrValue: string) => {
    setLoading(true);
    setScanResult(null);

    try {
      const searchTerm = qrValue.trim();
      const foundReg = registrations.find(r => (r.qrCode || r.id) === searchTerm);

      if (!foundReg) {
        setScanResult({
          type: 'error',
          title: 'Invalid QR Code',
          message: 'This QR code is not registered for this event.',
        });
        playSound('error');
        return;
      }
      
      if (foundReg.attended) {
         setScanResult({
          type: 'warning',
          title: 'Already Checked In!',
          message: `${foundReg.userName} already checked in.`,
          student: foundReg
        });
        playSound('warning');
        return;
      }

      await updateDoc(doc(db, 'registrations', foundReg.id), {
        attended: true,
        attendedAt: serverTimestamp(),
        scannedBy: currentUser?.uid
      });

      setScanResult({
        type: 'success',
        title: 'Check-In Successful!',
        message: `Welcome, ${foundReg.userName}!`,
        student: foundReg
      });
      playSound('success');

      setRecentScans(prev => [{...foundReg, time: new Date().toLocaleTimeString()}, ...prev.slice(0, 4)]);
      await fetchRegistrations();

    } catch (error: any) {
      setScanResult({ type: 'error', title: 'Error', message: error.message });
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  const continueScan = () => {
    setScanResult(null);
    startScanner();
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">Attendance Scanner</h1>
        <p className="text-muted-foreground">Scan student QR codes to mark attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={(value) => { if(isScanning) stopScanner(); setSelectedEventId(value); setScanResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Event --" />
            </SelectTrigger>
            <SelectContent>
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          <div className="grid grid-cols-3 gap-4">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attended</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{stats.attended}</div></CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-amber-600">{stats.total - stats.attended}</div></CardContent>
            </Card>
          </div>

          <Card>
             <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <CardTitle>Step 2: Scan QR Code</CardTitle>
                 {!isScanning ? (
                    <Button onClick={startScanner} className="w-full sm:w-auto"><Camera className="mr-2 h-4 w-4" /> Start Camera</Button>
                ) : (
                    <Button onClick={stopScanner} variant="destructive" className="w-full sm:w-auto"><CameraOff className="mr-2 h-4 w-4" /> Stop Camera</Button>
                )}
             </CardHeader>
             <CardContent>
                <div id="qr-reader" className={`w-full max-w-md mx-auto rounded-xl overflow-hidden ${!isScanning ? 'hidden' : ''}`} style={{ minHeight: isScanning ? '300px' : '0' }}></div>
                {!isScanning && !scanResult && !loading && (
                    <div className="text-center py-12 rounded-lg bg-muted/50">
                        <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Click "Start Camera" to scan QR codes</p>
                    </div>
                )}
                 {loading && (
                  <div className="text-center py-12"><Skeleton className="h-16 w-16 rounded-full animate-spin mx-auto" /><p className="mt-4 text-muted-foreground">Verifying...</p></div>
                )}
                 {scanResult && !loading && (
                  <div className={`rounded-xl p-6 text-center border-2 ${
                    scanResult.type === 'success' ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' :
                    scanResult.type === 'warning' ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' :
                    'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
                  }`}>
                    {scanResult.type === 'success' ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /> :
                     scanResult.type === 'warning' ? <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" /> :
                     <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
                     
                    <h3 className="text-xl font-bold">{scanResult.title}</h3>
                    <p className="text-muted-foreground mb-4">{scanResult.message}</p>

                    {scanResult.student && (
                         <div className="mt-4 p-4 bg-background/50 rounded-lg inline-block">
                            <p className="font-semibold text-lg">{scanResult.student.userName}</p>
                            <p className="text-muted-foreground">Roll No: {scanResult.student.userRollNo}</p>
                        </div>
                    )}
                    
                    <Button onClick={continueScan} className="mt-6"><RefreshCw className="mr-2 h-4 w-4"/> Scan Next</Button>
                  </div>
                )}
             </CardContent>
          </Card>

          {recentScans.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Recent Check-ins</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Student</TableHead><TableHead>Time</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentScans.map((scan, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="font-medium">{scan.userName}</div>
                                        <div className="text-sm text-muted-foreground">{scan.userRollNo}</div>
                                    </TableCell>
                                    <TableCell>{scan.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
          )}

        </>
      )}
    </div>
  );
};

export default ScannerPage;
