
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { CancellationService } from '../cancellation-requests/cancellation.service';
import { CancellationResponse } from '../cancellation-requests/cancellation.models';

@Component({
  selector: 'app-cancellation-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-history.html',
  styleUrl: './cancellation-history.css',
})
export class CancellationHistory implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getMyCancellationHistory(this.pageNumber(), this.pageSize())
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
              'Unable to load your cancellation history.',
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

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadHistory();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadHistory();
    }
  }
}
