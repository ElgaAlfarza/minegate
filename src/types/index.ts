/**
 * MineGate - Kontrak Tipe Data Skema Google Sheets & API
 */

export type VehicleType =
  | 'DUMP_TRUCK'
  | 'WATER_TRUCK'
  | 'FUEL_TRUCK'
  | 'BUS'
  | 'LIGHT_VEHICLE'
  | 'EXCAVATOR_SUPPORT';

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export type GateLogStatus = 'INSIDE' | 'OUT';

export type GateStation = 'GATE_1_MAIN' | 'GATE_2_PIT' | 'GATE_3_WORKSHOP';

export type LogPurpose = 'HAULING' | 'OPERATIONAL' | 'MAINTENANCE' | 'LOGISTICS' | 'OTHER';

export type UserRole = 'ADMIN' | 'OFFICER' | 'SUPERVISOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

// 1. Tab: vehicles
// vehicle_id | unit_code | plate_number | type | brand_model | owner_company | status | last_odometer | created_at
export interface Vehicle {
  vehicle_id: string;
  unit_code: string;
  plate_number: string;
  type: VehicleType;
  brand_model: string;
  owner_company: string;
  status: VehicleStatus;
  last_odometer: number;
  created_at: string;
}

// 2. Tab: drivers
// driver_id | name | license_type | company | phone | status | created_at
export interface Driver {
  driver_id: string;
  name: string;
  license_type: string;
  company: string;
  phone: string;
  status: DriverStatus;
  created_at: string;
}

// 3. Tab: gate_logs
// log_id | vehicle_id | driver_id | gate | purpose | destination | time_in | time_out | odometer_in | odometer_out | status | officer_id | notes
export interface GateLog {
  log_id: string;
  vehicle_id: string;
  driver_id: string;
  gate: GateStation;
  purpose: LogPurpose;
  destination: string;
  time_in: string;
  time_out?: string;
  odometer_in: number;
  odometer_out?: number;
  status: GateLogStatus;
  officer_id: string;
  notes: string;
}

// 4. Tab: users
// user_id | name | username | password_hash | role | status | created_at
export interface User {
  user_id: string;
  name: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface ActiveInsideVehicle extends GateLog {
  vehicle?: Vehicle;
  driver?: Driver;
  duration_minutes: number;
  duration_formatted: string;
  is_overstay: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface DashboardSummary {
  vehicles_inside_count: number;
  today_checkin_count: number;
  today_checkout_count: number;
  average_duration_minutes: number;
  average_duration_formatted: string;
  overstay_list: ActiveInsideVehicle[];
  vehicle_type_distribution: Record<VehicleType, number>;
  hourly_traffic_today: Array<{
    hour: string;
    in: number;
    out: number;
  }>;
  daily_traffic_last_7_days: Array<{
    date: string;
    in: number;
    out: number;
  }>;
  recent_activities: GateLog[];
}
