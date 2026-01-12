import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: CustomerListComponent },
  { path: 'customer/:id', component: CustomerDetailComponent },
  { path: 'transaction/:type/:customerId', component: TransactionFormComponent }, // type: 'bill' | 'payment'
  { path: '**', redirectTo: 'dashboard' }
];