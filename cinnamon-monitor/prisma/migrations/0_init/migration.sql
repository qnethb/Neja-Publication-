-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "generalManagerId" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estate" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "managerId" TEXT,
    "assistantManagerId" TEXT,
    "totalAreaHa" DOUBLE PRECISION NOT NULL,
    "mainCrops" TEXT NOT NULL,
    "district" TEXT,

    CONSTRAINT "Estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT NOT NULL,
    "plantingYear" INTEGER NOT NULL,
    "variety" TEXT,
    "geoJsonBoundary" TEXT,
    "centroidLat" DOUBLE PRECISION,
    "centroidLng" DOUBLE PRECISION,
    "soilType" TEXT,
    "irrigationType" TEXT,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CinnamonBlock" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "blockCode" TEXT NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "density" INTEGER NOT NULL,
    "soilType" TEXT,
    "irrigationType" TEXT,

    CONSTRAINT "CinnamonBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropHistory" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "crop" TEXT NOT NULL DEFAULT 'CINNAMON',
    "season" TEXT NOT NULL,
    "seasonStart" TIMESTAMP(3) NOT NULL,
    "seasonEnd" TIMESTAMP(3) NOT NULL,
    "expectedYieldKgHa" DOUBLE PRECISION NOT NULL,
    "actualYieldKgHa" DOUBLE PRECISION,
    "gradeMixQuillPct" DOUBLE PRECISION,
    "gradeMixFeatheringsPct" DOUBLE PRECISION,
    "gradeMixChipsPct" DOUBLE PRECISION,
    "harvestMethod" TEXT,
    "notes" TEXT,

    CONSTRAINT "CropHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operationType" TEXT NOT NULL,
    "inputProduct" TEXT,
    "rate" TEXT,
    "costLkr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weatherNotes" TEXT,
    "loggedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilWeatherSnapshot" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pH" DOUBLE PRECISION,
    "nitrogenPpm" DOUBLE PRECISION,
    "phosphorusPpm" DOUBLE PRECISION,
    "potassiumPpm" DOUBLE PRECISION,
    "organicMatterPct" DOUBLE PRECISION,
    "rainfallMm" DOUBLE PRECISION,
    "tempC" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "SoilWeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "predictedYieldKgHa" DOUBLE PRECISION NOT NULL,
    "confidencePct" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "keyDrivers" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "rationale" TEXT,
    "expectedImpact" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progressNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserEstates" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserDivisions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Estate_code_key" ON "Estate"("code");

-- CreateIndex
CREATE INDEX "Estate_groupId_idx" ON "Estate"("groupId");

-- CreateIndex
CREATE INDEX "Division_primaryCrop_idx" ON "Division"("primaryCrop");

-- CreateIndex
CREATE UNIQUE INDEX "Division_estateId_name_key" ON "Division"("estateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CinnamonBlock_divisionId_blockCode_key" ON "CinnamonBlock"("divisionId", "blockCode");

-- CreateIndex
CREATE INDEX "CropHistory_season_idx" ON "CropHistory"("season");

-- CreateIndex
CREATE UNIQUE INDEX "CropHistory_divisionId_crop_season_key" ON "CropHistory"("divisionId", "crop", "season");

-- CreateIndex
CREATE INDEX "OperationLog_divisionId_date_idx" ON "OperationLog"("divisionId", "date");

-- CreateIndex
CREATE INDEX "SoilWeatherSnapshot_divisionId_date_idx" ON "SoilWeatherSnapshot"("divisionId", "date");

-- CreateIndex
CREATE INDEX "Prediction_divisionId_idx" ON "Prediction"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_divisionId_season_modelVersion_key" ON "Prediction"("divisionId", "season", "modelVersion");

-- CreateIndex
CREATE INDEX "Recommendation_divisionId_status_idx" ON "Recommendation"("divisionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "_UserGroups_AB_unique" ON "_UserGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_UserGroups_B_index" ON "_UserGroups"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserEstates_AB_unique" ON "_UserEstates"("A", "B");

-- CreateIndex
CREATE INDEX "_UserEstates_B_index" ON "_UserEstates"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserDivisions_AB_unique" ON "_UserDivisions"("A", "B");

-- CreateIndex
CREATE INDEX "_UserDivisions_B_index" ON "_UserDivisions"("B");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_generalManagerId_fkey" FOREIGN KEY ("generalManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estate" ADD CONSTRAINT "Estate_assistantManagerId_fkey" FOREIGN KEY ("assistantManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CinnamonBlock" ADD CONSTRAINT "CinnamonBlock_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropHistory" ADD CONSTRAINT "CropHistory_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationLog" ADD CONSTRAINT "OperationLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilWeatherSnapshot" ADD CONSTRAINT "SoilWeatherSnapshot_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroups" ADD CONSTRAINT "_UserGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroups" ADD CONSTRAINT "_UserGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserEstates" ADD CONSTRAINT "_UserEstates_A_fkey" FOREIGN KEY ("A") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserEstates" ADD CONSTRAINT "_UserEstates_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDivisions" ADD CONSTRAINT "_UserDivisions_A_fkey" FOREIGN KEY ("A") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDivisions" ADD CONSTRAINT "_UserDivisions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

