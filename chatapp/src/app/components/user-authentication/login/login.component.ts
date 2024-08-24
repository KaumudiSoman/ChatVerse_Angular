import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm : FormGroup = new FormGroup({}); 

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastrService: ToastrService) { }

  ngOnInit(): void {
      this.initializeForm();
      console.log('load')
  }

  initializeForm() {
    this.loginForm = this.fb.group ({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]]
    });
  }

  login() {
    let formValue = this.loginForm.value;
    
    this.authService.login(String(formValue.email), String(formValue.password)).subscribe({
      next: () => {this.router.navigateByUrl('chat')},
      error: err => {this.toastrService.error(err.message)}
    })
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle();
  } 
}
