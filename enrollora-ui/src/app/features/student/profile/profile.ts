
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { StudentResponse, UpdateMyProfileRequest } from '../../admin/students/student.models';
import { StudentService } from '../../admin/students/student.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class StudentProfile implements OnInit {
  private studentService = inject(StudentService);

  profile = signal<StudentResponse | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  profileForm = new FormGroup({
    name: new FormControl('', Validators.required),
    department: new FormControl('', Validators.required),
    age: new FormControl(18, [
      Validators.required,
      Validators.min(17),
      Validators.max(60),
    ]),
    cgpa: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(10),
    ]),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.studentService.getMyProfile().subscribe({
      next: (response) => {
        this.profile.set(response);

        this.profileForm.patchValue({
          name: response.name,
          department: response.department,
          age: response.age,
          cgpa: response.cgpa,
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.errorMessage.set('Unable to load your profile.');
        this.isLoading.set(false);
      },
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.isSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();

    const request: UpdateMyProfileRequest = {
      name: formValue.name!,
      department: formValue.department!,
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.studentService.updateMyProfile(request).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.successMessage.set('Profile updated successfully.');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.errorMessage.set('Unable to update your profile.');
        this.isSaving.set(false);
      },
    });
  }

  statusLabel(status: number): string {
    switch (status) {
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Pending';
    }
  }
}