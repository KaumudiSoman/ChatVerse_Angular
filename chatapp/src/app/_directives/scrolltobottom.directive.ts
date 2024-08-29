import { AfterViewChecked, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appScrolltobottom]'
})
export class ScrolltobottomDirective implements AfterViewChecked {
  private element: HTMLElement;

  constructor(private el: ElementRef) {
    this.element = this.el.nativeElement;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  }
}
