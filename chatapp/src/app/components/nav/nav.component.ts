import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
  constructor(public authService: AuthService, private router: Router, private toastrService: ToastrService) {
    console.log(authService.currentUserSig(), 'hello')
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {this.router.navigateByUrl('login')},
      error: err => {this.toastrService.error(err.message)}
    });
  }
}
