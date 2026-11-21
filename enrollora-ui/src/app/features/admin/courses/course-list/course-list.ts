
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Course List
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Course Form
  isFormOpen = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);

  editingCourseId: number | null = null;

  formError = signal('');

  courseFormData: SaveCourseRequest = this.getEmptyCourse();

  ngOnInit(): void {
    this.loadCourses();
  }

  // Empty Course Form
  getEmptyCourse(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
  }

  // Load Courses
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.pageNumber.set(response.pageNumber);

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set('Unable to load courses.');
        this.isLoading.set(false);
      },
    });
  }

  // Open Add Course Form
  openAddForm(): void {
    this.courseFormData = this.getEmptyCourse();

    this.editingCourseId = null;
    this.isEditing.set(false);

    this.formError.set('');
    this.isFormOpen.set(true);
  }

  // Open Edit Course Form
  openEditForm(course: CourseResponse): void {
    this.courseFormData = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    };

    this.editingCourseId = course.courseId;
    this.isEditing.set(true);

    this.formError.set('');
    this.isFormOpen.set(true);
  }

  // Close Course Form
  closeForm(): void {
    this.isFormOpen.set(false);
    this.formError.set('');
    this.editingCourseId = null;
    this.courseFormData = this.getEmptyCourse();
  }

  // Save Course (Add / Edit)
  saveCourse(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

    if (this.isEditing() && this.editingCourseId !== null) {

      // Update Existing Course
      this.courseService
        .updateCourse(this.editingCourseId, this.courseFormData)
        .subscribe({
          next: () => {
            alert('Course updated successfully.');

            this.closeForm();
            this.isSaving.set(false);
            this.loadCourses();
          },

          error: (error) => {
            console.error('Error updating course:', error);

            this.formError.set(
              error.error?.message || 'Unable to update course.'
            );

            this.isSaving.set(false);
          },
        });

    } else {

      // Create New Course
      this.courseService.createCourse(this.courseFormData).subscribe({
        next: () => {
          alert('Course added successfully.');

          this.closeForm();

          // Return to first page to show the new course
          this.pageNumber.set(1);

          this.isSaving.set(false);
          this.loadCourses();
        },

        error: (error) => {
          console.error('Error adding course:', error);

          this.formError.set(
            error.error?.message || 'Unable to add course.'
          );

          this.isSaving.set(false);
        },
      });
    }
  }

  // Deactivate Course
  deactivateCourse(course: CourseResponse): void {
    if (!confirm(
      `Are you sure you want to deactivate "${course.courseName}"?`
    )) {
      return;
    }

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: (response) => {
        alert(response.message || 'Course deactivated successfully.');

        this.loadCourses();
      },

      error: (error) => {
        console.error('Error deactivating course:', error);

        alert(
          error.error?.message || 'Unable to deactivate course.'
        );
      },
    });
  }

  // Next Page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  // Previous Page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}
