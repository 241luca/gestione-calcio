-- CreateTable
CREATE TABLE "transport_routes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "stops" JSONB,
    "distance" DOUBLE PRECISION,
    "estimatedTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_schedules" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "vehicleType" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_bookings" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "pickupPoint" TEXT,
    "dropoffPoint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_bookings_scheduleId_athleteId_bookingDate_key" ON "transport_bookings"("scheduleId", "athleteId", "bookingDate");

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "transport_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
