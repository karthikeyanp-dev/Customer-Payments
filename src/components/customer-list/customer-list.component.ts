import { Component, inject, signal, computed } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="p-4 space-y-4">
      
      <!-- Total Receivables Card -->
      <div class="bg-blue-800 rounded-xl p-5 text-white shadow-lg flex justify-between items-center">
        <div>
          <p class="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Market Due</p>
          <h2 class="text-4xl font-bold mt-1">\${{ store.totalReceivables() | number:'1.0-2' }}</h2>
        </div>
        <div class="bg-blue-700 p-3 rounded-full opacity-50">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
          </svg>
        </div>
      </div>

      <!-- Search/Filter -->
      <div class="relative">
        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          class="block w-full p-4 ps-10 text-lg text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" 
          placeholder="Search Customer..." 
        />
      </div>

      <!-- Add Form -->
      @if (showAddForm()) {
        <div class="bg-white p-5 rounded-lg shadow-md border-2 border-blue-500 animate-fade-in">
          <h3 class="font-bold text-gray-800 mb-4 text-xl">New Customer</h3>
          <input 
            type="text" 
            [(ngModel)]="newCustomerName"
            placeholder="Name (e.g. John Doe)" 
            class="w-full mb-3 p-3 border rounded text-lg bg-gray-50 focus:bg-white text-gray-900"
          >
          <input 
            type="tel" 
            [(ngModel)]="newCustomerPhone"
            placeholder="Phone Number (Optional)" 
            class="w-full mb-4 p-3 border rounded text-lg bg-gray-50 focus:bg-white text-gray-900"
          >
          <div class="flex gap-3">
            <button (click)="saveCustomer()" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg">Save</button>
            <button (click)="cancelAdd()" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold text-lg">Cancel</button>
          </div>
        </div>
      }

      <!-- Add New Customer Button (Visible only when form is closed) -->
      @if (!showAddForm()) {
        <button 
          (click)="showAddForm.set(true)"
          class="w-full bg-white hover:bg-gray-50 text-blue-700 font-bold py-3 px-4 rounded-lg border-2 border-blue-100 border-dashed flex items-center justify-center gap-2 touch-target">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Add New Customer
        </button>
      }

      <!-- Customer List -->
      <div class="space-y-3 mt-4 pb-20">
        @for (c of filteredCustomers(); track c.id) {
          <div class="block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" 
               (click)="goToDetail(c.id)">
            <!-- Main Row -->
            <div class="flex justify-between items-center p-4">
              <div class="flex-1">
                <h3 class="font-bold text-xl text-gray-900">{{ c.name }}</h3>
                @if (c.phone) {
                  <p class="text-gray-500">{{ c.phone }}</p>
                }
              </div>
              <div class="text-right pl-4">
                @let bal = getBalance(c.id);
                <p class="text-xl font-extrabold" [class.text-red-600]="bal > 0" [class.text-green-600]="bal <= 0">
                  @if(bal > 0) { \${{ bal | number:'1.0-0' }} }
                  @else if (bal < 0) { +\${{ Math.abs(bal) | number:'1.0-0' }} }
                  @else { $0 }
                </p>
                @if (bal > 0) {
                  <p class="text-xs text-red-500 font-bold uppercase">Due</p>
                } @else if (bal < 0) {
                  <p class="text-xs text-green-500 font-bold uppercase">Advance</p>
                }
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
              <button (click)="$event.stopPropagation(); quickAction('bill', c.id)" 
                      class="py-3 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center gap-1 active:bg-red-100">
                <span class="text-xl">+</span> Bill
              </button>
              <button (click)="$event.stopPropagation(); quickAction('payment', c.id)"
                      class="py-3 text-green-600 font-bold hover:bg-green-50 flex items-center justify-center gap-1 active:bg-green-100">
                <span class="text-xl">+</span> Pay
              </button>
            </div>
          </div>
        }
        
        @if (filteredCustomers().length === 0) {
          <div class="text-center py-10">
            <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8 text-gray-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <p class="text-gray-500 font-medium">No customers yet.</p>
            <p class="text-gray-400 text-sm mt-1">Tap "Add New Customer" above to start.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class CustomerListComponent {
  store = inject(StoreService);
  router = inject(Router);
  Math = Math; 

  searchQuery = '';
  showAddForm = signal(false);
  newCustomerName = '';
  newCustomerPhone = '';

  filteredCustomers = computed(() => {
    const query = this.searchQuery.toLowerCase();
    const list = this.store.customers();
    if (!query) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.phone && c.phone.includes(query))
    );
  });

  getBalance(id: string) {
    return this.store.getCustomerBalance(id);
  }

  saveCustomer() {
    if (!this.newCustomerName.trim()) return;
    this.store.addCustomer(this.newCustomerName, this.newCustomerPhone);
    this.newCustomerName = '';
    this.newCustomerPhone = '';
    this.showAddForm.set(false);
  }

  cancelAdd() {
    this.showAddForm.set(false);
    this.newCustomerName = '';
    this.newCustomerPhone = '';
  }

  goToDetail(id: string) {
    this.router.navigate(['/customer', id]);
  }

  quickAction(type: 'bill' | 'payment', id: string) {
    this.router.navigate(['/transaction', type, id]);
  }
}