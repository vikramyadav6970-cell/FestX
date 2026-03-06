'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'react-qr-code';
import {
  Image as ImageIcon,
  Type,
  Palette,
  Save,
  Eye,
  ArrowLeft,
  Upload,
  Trash2,
  Settings,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CertificateElement {
  id: string;
  type: 'text' | 'dynamic' | 'qrcode';
  content?: string;
  field?: string;
  placeholder?: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  size?: number;
}

interface CertificateTemplate {
  name: string;
  backgroundImage: string | null;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  elements: CertificateElement[];
}

export default function CertificateDesignerPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [template, setTemplate] = useState<CertificateTemplate>({
    name: 'Event Certificate',
    backgroundImage: null,
    backgroundColor: '#ffffff',
    borderColor: '#6366f1',
    borderWidth: 10,
    elements: [
      {
        id: 'header',
        type: 'text',
        content: 'CERTIFICATE OF PARTICIPATION',
        x: 50,
        y: 15,
        fontSize: 28,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        color: '#1a1a1a',
        align: 'center'
      },
      {
        id: 'subheader',
        type: 'text',
        content: 'This is to certify that',
        x: 50,
        y: 35,
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#666666',
        align: 'center'
      },
      {
        id: 'participantName',
        type: 'dynamic',
        field: 'participantName',
        placeholder: '[Participant Name]',
        x: 50,
        y: 45,
        fontSize: 36,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        color: '#1a1a1a',
        align: 'center'
      },
      {
        id: 'participation',
        type: 'text',
        content: 'has successfully participated in',
        x: 50,
        y: 55,
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#666666',
        align: 'center'
      },
      {
        id: 'eventName',
        type: 'dynamic',
        field: 'eventName',
        placeholder: '[Event Name]',
        x: 50,
        y: 63,
        fontSize: 28,
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        color: '#6366f1',
        align: 'center'
      },
      {
        id: 'date',
        type: 'dynamic',
        field: 'date',
        placeholder: '[Event Date]',
        x: 50,
        y: 75,
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#666666',
        align: 'center'
      },
      {
        id: 'organizerName',
        type: 'dynamic',
        field: 'organizerName',
        placeholder: '[Organizer Name]',
        x: 25,
        y: 88,
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#1a1a1a',
        align: 'center'
      },
      {
        id: 'organizerTitle',
        type: 'text',
        content: 'Event Organizer',
        x: 25,
        y: 92,
        fontSize: 12,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#666666',
        align: 'center'
      },
      {
        id: 'qrCode',
        type: 'qrcode',
        x: 85,
        y: 85,
        size: 50
      }
    ]
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplate(prev => ({
          ...prev,
          backgroundImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (elementId: string, updates: Partial<CertificateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  };

  const removeElement = (elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    setSelectedElement(null);
  };

  const addTextElement = () => {
    const newElement: CertificateElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      content: 'New Text',
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#1a1a1a',
      align: 'center'
    };
    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement.id);
  };

  const handleSaveTemplate = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const templateData = {
        ...template,
        eventId: eventId,
        organizerId: currentUser.uid,
        organizerName: userProfile?.name || 'Organizer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'certificateTemplates'), templateData);
      toast({ title: 'Template saved successfully!' });
      router.push(`/organizer/event/${eventId}/certificates`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ variant: 'destructive', title: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const previewData: Record<string, string> = useMemo(() => ({
    participantName: 'John Doe',
    eventName: event?.title || 'Sample Event',
    date: event?.date ? new Date(event.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : 'January 1, 2025',
    organizerName: userProfile?.name || 'Organizer Name',
    verificationCode: 'FESTX-CERT-SAMPLE123'
  }), [event, userProfile]);

  const getElementContent = (element: CertificateElement) => {
    if (element.type === 'dynamic') {
      return previewMode ? (previewData[element.field!] || element.placeholder) : element.placeholder;
    }
    return element.content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificate Designer</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSaveTemplate}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Background
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.backgroundColor}
                    onChange={(e) => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.borderColor}
                    onChange={(e) => setTemplate(prev => ({ ...prev, borderColor: e.target.value }))}
                    className="w-full h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Background
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                {template.backgroundImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => setTemplate(prev => ({ ...prev, backgroundImage: null }))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove Background
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="w-4 h-4" /> Add Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="secondary" className="w-full" onClick={addTextElement}>
                <Type className="w-4 h-4 mr-2" /> Add Text
              </Button>
            </CardContent>
          </Card>

          {selectedElement && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {(() => {
                  const element = template.elements.find(el => el.id === selectedElement);
                  if (!element) return null;

                  return (
                    <>
                      {element.type === 'text' && (
                        <div className="space-y-2">
                          <Label>Text Content</Label>
                          <Input
                            value={element.content}
                            onChange={(e) => updateElement(element.id, { content: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>X (%)</Label>
                          <Input
                            type="number"
                            value={element.x}
                            onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Y (%)</Label>
                          <Input
                            type="number"
                            value={element.y}
                            onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {element.type !== 'qrcode' && (
                        <>
                          <div className="space-y-2">
                            <Label>Font Size</Label>
                            <Input
                              type="number"
                              value={element.fontSize}
                              onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 12 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={element.color}
                              onChange={(e) => updateElement(element.id, { color: e.target.value })}
                              className="h-10 p-1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <Select
                              value={element.fontWeight}
                              onValueChange={(v) => updateElement(element.id, { fontWeight: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {element.type === 'text' && (
                        <Button
                          variant="ghost"
                          className="w-full text-destructive"
                          onClick={() => removeElement(element.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Element
                        </Button>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-muted dark:bg-slate-900 rounded-xl p-4 sm:p-8 flex items-center justify-center min-h-[600px] overflow-auto">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl shrink-0"
              style={{
                width: '800px',
                height: '566px',
                backgroundColor: template.backgroundColor,
                backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: `${template.borderWidth}px solid ${template.borderColor}`
              }}
            >
              {template.elements.map((element) => (
                <div
                  key={element.id}
                  onClick={() => !previewMode && setSelectedElement(element.id)}
                  className={`absolute cursor-pointer transition-all ${
                    selectedElement === element.id && !previewMode
                      ? 'ring-2 ring-primary ring-offset-2'
                      : ''
                  }`}
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: element.align === 'center' ? 'translateX(-50%)' : 'none'
                  }}
                >
                  {element.type === 'qrcode' ? (
                    <div className="bg-white p-2 rounded">
                      <QRCode
                        value={previewData.verificationCode}
                        size={element.size || 50}
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
                      {getElementContent(element)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-4 text-sm">
            Click on elements to select and edit. Use the properties panel to customize.
          </p>
        </div>
      </div>
    </div>
  );
}
