
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';
import { CancellationService } from '../../../student/cancellation-requests/cancellation.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationService);

  enrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedEnrollment = signal<EnrollmentResponse | null>(null);
  requestReason = signal('');
  isSubmitting = signal(false);
  cancellationError = signal('');
  cancellationSuccess = signal('');
  requestedEnrollmentIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail ||
              body?.message ||
              body?.title ||
              'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  hasRequestedCancellation(enrollmentId: number): boolean {
    return this.requestedEnrollmentIds().includes(enrollmentId);
  }

  openCancellationModal(enrollment: EnrollmentResponse): void {
    this.selectedEnrollment.set(enrollment);
    this.requestReason.set('');
    this.cancellationError.set('');
  }

  closeCancellationModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.selectedEnrollment.set(null);
    this.requestReason.set('');
    this.cancellationError.set('');
  }

  submitCancellationRequest(): void {
    const enrollment = this.selectedEnrollment();
    const reason = this.requestReason().trim();

    if (!enrollment || this.isSubmitting()) {
      return;
    }

    if (!reason) {
      this.cancellationError.set('Please enter a reason for cancellation.');
      return;
    }

    this.isSubmitting.set(true);
    this.cancellationError.set('');

    this.cancellationService
      .createCancellationRequest(enrollment.enrollmentId, { reason })
      .subscribe({
        next: () => {
          this.requestedEnrollmentIds.update((ids) => [
            ...ids,
            enrollment.enrollmentId,
          ]);

          this.cancellationSuccess.set(
            `Cancellation request submitted for ${enrollment.courseName}. It is waiting for administrator approval.`,
          );

          this.selectedEnrollment.set(null);
          this.requestReason.set('');
          this.isSubmitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;

          this.cancellationError.set(
            body?.detail ||
              body?.message ||
              body?.title ||
              'Unable to submit the cancellation request.',
          );

          this.isSubmitting.set(false);
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
