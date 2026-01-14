/**
 * Orders Module Entry Point
 * Refactored to MVC pattern in ./orders/
 */
import { controller } from './orders/controller.js';

export const loadOrders = () => controller.loadOrders();
export const openEditOrderModal = (id) => controller.openEditOrderModal(id);
export const saveOrderDetails = () => controller.saveOrderDetails();
// Other globals are bound to window in controller.js
