package com.solarix.mobile.data.remote.dtos

import com.google.gson.annotations.SerializedName
import java.io.Serializable

data class CreateReservationRequest(
    @SerializedName("prosumerNIC") val prosumerNIC: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("slotId") val slotId: String,
    @SerializedName("energyAmountKW") val energyAmountKW: Double,
    @SerializedName("tradeType") val tradeType: String = "DropOff"
)

data class UpdateReservationRequest(
    @SerializedName("newSlotId") val newSlotId: String?,
    @SerializedName("newEnergyAmountKW") val newEnergyAmountKW: Double?,
    @SerializedName("tradeType") val tradeType: String?
)

data class CancelReservationRequest(
    @SerializedName("prosumerNIC") val prosumerNIC: String,
    @SerializedName("reason") val reason: String = "Cancelled by user"
)

data class VerifyAndCompleteRequest(
    @SerializedName("qrToken") val qrToken: String,
    @SerializedName("operatorId") val operatorId: String,
    @SerializedName("energyDeliveredKWh") val energyDeliveredKWh: Double,
    @SerializedName("notes") val notes: String?
)

data class ReservationResponse(
    @SerializedName("id") val id: String,
    @SerializedName("reservationNumber") val reservationNumber: String,
    @SerializedName("prosumerNIC") val prosumerNIC: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("stationName") val stationName: String,
    @SerializedName("slotId") val slotId: String,
    @SerializedName("reservationDate") val reservationDate: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("energyAmountKW") val energyAmountKW: Double,
    @SerializedName("tradeType") val tradeType: String,
    @SerializedName("status") val status: String,
    @SerializedName("qrCodeToken") val qrCodeToken: String,
    @SerializedName("cancellationReason") val cancellationReason: String?,
    @SerializedName("cancelledAt") val cancelledAt: String?,
    @SerializedName("finalizedByOperatorNIC") val finalizedByOperatorNIC: String?,
    @SerializedName("finalizedAt") val finalizedAt: String?,
    @SerializedName("operatorNotes") val operatorNotes: String?,
    @SerializedName("createdAt") val createdAt: String?
) : Serializable

data class DashboardSummaryResponse(
    @SerializedName("totalStations") val totalStations: Int,
    @SerializedName("activeStations") val activeStations: Int,
    @SerializedName("totalProsumers") val totalProsumers: Int,
    @SerializedName("pendingProsumerApprovals") val pendingProsumerApprovals: Int,
    @SerializedName("pendingReservationsCount") val pendingReservationsCount: Int,
    @SerializedName("approvedFutureReservationsCount") val approvedFutureReservationsCount: Int,
    @SerializedName("completedReservationsCount") val completedReservationsCount: Int,
    @SerializedName("cancelledReservationsCount") val cancelledReservationsCount: Int,
    @SerializedName("totalEnergyTradedKW") val totalEnergyTradedKW: Double
)
