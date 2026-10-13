-- CreateIndex
CREATE INDEX "Booking_vehicleId_pickupDate_idx" ON "Booking"("vehicleId", "pickupDate");

-- CreateIndex
CREATE INDEX "Booking_pickupDate_idx" ON "Booking"("pickupDate");

-- CreateIndex
CREATE INDEX "Dispatch_vehicleId_idx" ON "Dispatch"("vehicleId");

-- CreateIndex
CREATE INDEX "Dispatch_driverId_idx" ON "Dispatch"("driverId");

