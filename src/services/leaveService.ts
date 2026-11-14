import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { LeaveRequest, LeaveStatus } from '../types/models';
import { analyzeReason } from './sentimentService';

export interface SubmitLeaveParams {
  session: {
    id: string;
    classId?: string;
    courseTitle: string;
    moduleName: string;
  };
  profile: {
    uid: string;
    name: string;
    nim?: string | null;
  };
  reason: string;
}

/**
 * Check if the student has already submitted a leave request for the given session.
 */
export async function getExistingLeaveRequest(
  sessionId: string,
  uid: string
): Promise<LeaveRequest | null> {
  const docRef = doc(db, 'leaveRequests', `${sessionId}_${uid}`);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
    } as LeaveRequest;
  }
  return null;
}

/**
 * Submit a leave request (SRS-12, SRS-14).
 * Single request per student per session (leaveRequests/{sessionId}_{uid}).
 */
export async function submitLeaveRequest(
  params: SubmitLeaveParams
): Promise<LeaveRequest> {
  const { session, profile, reason } = params;
  const requestId = `${session.id}_${profile.uid}`;
  const docRef = doc(db, 'leaveRequests', requestId);

  // Check anti-double submit for leave request
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error('Anda sudah mengajukan izin untuk sesi ini');
  }

  // Analyze sentiment
  const sentiment = analyzeReason(reason);

  const payload = {
    sessionId: session.id,
    classId: session.classId || 'class-ti-01',
    uid: profile.uid,
    studentName: profile.name,
    studentNim: profile.nim || '',
    courseTitle: session.courseTitle,
    moduleName: session.moduleName,
    reason: reason.trim(),
    sentiment,
    status: 'MENUNGGU' as LeaveStatus,
    decidedBy: null,
    decidedAt: null,
    assistantNote: '',
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);

  return {
    id: requestId,
    ...payload,
    createdAt: Timestamp.now(),
  };
}

/**
 * Real-time listener for current student's leave requests (SRS-13).
 * Client-side sorted (newest first) to avoid composite index requirement.
 */
export function listenMyLeaveRequests(
  uid: string,
  onUpdate: (requests: LeaveRequest[]) => void,
  onError: (error: any) => void
): () => void {
  const q = query(collection(db, 'leaveRequests'), where('uid', '==', uid));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: LeaveRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          ...data,
        } as LeaveRequest);
      });

      // Client-side sort: newest first
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      onUpdate(items);
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Real-time listener for all leave requests for assistant review (SRS-15).
 * Client-side sorted (newest first).
 */
export function listenAllLeaveRequests(
  onUpdate: (requests: LeaveRequest[]) => void,
  onError: (error: any) => void
): () => void {
  const colRef = collection(db, 'leaveRequests');

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: LeaveRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          ...data,
        } as LeaveRequest);
      });

      // Client-side sort: newest first
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      onUpdate(items);
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Assistant decision for leave request (SRS-16).
 * Updates only status, decidedBy, decidedAt, and assistantNote.
 */
export async function decideLeaveRequest(
  requestId: string,
  decision: 'DITERIMA' | 'DITOLAK',
  assistantUid: string,
  assistantNote: string = ''
): Promise<void> {
  const docRef = doc(db, 'leaveRequests', requestId);

  await updateDoc(docRef, {
    status: decision,
    decidedBy: assistantUid,
    decidedAt: serverTimestamp(),
    assistantNote: assistantNote.trim(),
  });
}

