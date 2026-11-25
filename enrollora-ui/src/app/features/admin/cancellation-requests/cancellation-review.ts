
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { CancellationService } from '../../student/cancellation-requests/cancellation.service';
import { CancellationResponse } from '../../student/cancellation-requests/cancellation.models';

@Component({
  selector: 'app-cancellation-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-review.html',
  styleUrl: './cancellation-review.css',
})
export class CancellationReview implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedRequest = signal<CancellationResponse | null>(null);
  selectedAction = signal<'approve' | 'reject' | null>(null);
  adminRemarks = signal('');
  isSubmitting = signal(false);
  reviewError = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getAllCancellationRequests(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail ||
              error.error?.message ||
              'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  statusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  }

  openReview(
    request: CancellationResponse,
    action: 'approve' | 'reject',
  ): void {
    this.selectedRequest.set(request);
    this.selectedAction.set(action);
    this.adminRemarks.set('');
    this.reviewError.set('');
  }

  closeReview(): void {
    if (this.isSubmitting()) return;

    this.selectedRequest.set(null);
    this.selectedAction.set(null);
    this.adminRemarks.set('');
    this.reviewError.set('');
  }

  submitReview(): void {
    const request = this.selectedRequest();
    const action = this.selectedAction();

    if (!request || !action || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.reviewError.set('');
    this.successMessage.set('');

    this.cancellationService
      .reviewCancellationRequest(
        request.cancellationRequestId,
        action,
        this.adminRemarks().trim(),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            action === 'approve'
              ? 'Cancellation request approved successfully.'
              : 'Cancellation request rejected successfully.',
          );

          this.closeReviewAfterSuccess();
          this.loadRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.reviewError.set(
            error.error?.detail ||
              error.error?.message ||
              'Unable to review this request.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  private closeReviewAfterSuccess(): void {
    this.selectedRequest.set(null);
    this.selectedAction.set(null);
    this.adminRemarks.set('');
    this.isSubmitting.set(false);
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }
}
