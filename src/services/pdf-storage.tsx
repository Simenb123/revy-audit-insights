import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BilagPayload, GeneratedVoucher } from '@/types/bilag';
import { pdf } from '@react-pdf/renderer';
import { PdfInvoiceDocument } from '@/components/pdf/PdfInvoiceDocument';
import { PdfPaymentDocument } from '@/components/pdf/PdfPaymentDocument';
import { PdfJournalDocument } from '@/components/pdf/PdfJournalDocument';

/**
 * Calculate SHA256 hash of a blob
 */
async function calculateSHA256(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PDF blob from payload
 */
async function generatePdfBlob(payload: BilagPayload): Promise<Blob> {
  let documentElement;
  
  switch (payload.type) {
    case 'salgsfaktura':
    case 'leverandorfaktura':
      documentElement = <PdfInvoiceDocument payload={payload} />;
      break;
    case 'kundebetaling':
    case 'leverandorbetaling':
    case 'bankbilag':
      documentElement = <PdfPaymentDocument payload={payload} />;
      break;
    case 'diversebilag':  
    default:
      documentElement = <PdfJournalDocument payload={payload} />;
      break;
  }
  
  return await pdf(documentElement).toBlob();
}

/**
 * Upload PDF to Supabase Storage and create database record
 */
export async function uploadPdfToStorage(
  payload: BilagPayload,
  clientId: string
): Promise<GeneratedVoucher> {
  try {
    // Generate PDF blob
    const pdfBlob = await generatePdfBlob(payload);
    const sha256Hash = await calculateSHA256(pdfBlob);
    
    // Create storage path
    const year = new Date(payload.dato).getFullYear();
    const filename = `${payload.doknr || payload.bilag}.pdf`;
    const storagePath = `bilag/${clientId}/${year}/${filename}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(storagePath, pdfBlob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // Create database record
    const { data: voucher, error: insertError } = await supabase
      .from('generated_vouchers')
      .insert({
        client_id: clientId,
        bilag: payload.bilag.toString(),
        doknr: payload.doknr,
        type: payload.type,
        dokumenttype: payload.dokumenttype,
        storage_key: storagePath,
        sha256: sha256Hash,
        file_size: pdfBlob.size
      })
      .select()
      .single();
    
    if (insertError) {
      // Clean up storage if DB insert fails
      await supabase.storage.from('client-documents').remove([storagePath]);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }
    
    return voucher as GeneratedVoucher;
    
  } catch (error) {
    console.error('PDF upload error:', error);
    throw error;
  }
}

/**
 * Download PDF blob for local save
 */
export async function downloadPdf(payload: BilagPayload): Promise<Blob> {
  return await generatePdfBlob(payload);
}

/**
 * Get signed URL for accessing stored PDF
 */
export async function getPdfUrl(storageKey: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('client-documents')
    .createSignedUrl(storageKey, 60 * 60); // 1 hour
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}