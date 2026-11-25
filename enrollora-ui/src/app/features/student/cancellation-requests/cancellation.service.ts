
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../shared/models/paged-result.model';
import {
  CancellationResponse,
  CreateCancellationRequest,
} from './cancellation.models';

@Injectable({
  providedIn: 'root',
})
export class CancellationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cancellation-requests`;
  private readonly enrollmentUrl = `${environment.apiUrl}/enrollments`;

  createCancellationRequest(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${this.enrollmentUrl}/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  getMyCancellationHistory(
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortOrder', 'desc');

    return this.http.get<PagedResult<CancellationResponse>>(
      `${this.apiUrl}/my`,
      { params },
    );
  }

  getAllCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortOrder', 'desc');

    return this.http.get<PagedResult<CancellationResponse>>(
      this.apiUrl,
      { params },
    );
  }

  reviewCancellationRequest(
    requestId: number,
    action: 'approve' | 'reject',
    adminRemarks: string,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/${action}`,
      { adminRemarks },
    );
  }
}
