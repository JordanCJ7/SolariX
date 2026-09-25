package com.solarix.mobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.solarix.mobile.R
import com.solarix.mobile.data.remote.dtos.ReservationResponse
import com.solarix.mobile.databinding.ActivityBookingSummaryBinding

class BookingSummaryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBookingSummaryBinding
    private var reservation: ReservationResponse? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBookingSummaryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        @Suppress("DEPRECATION")
        reservation = intent.getSerializableExtra("RESERVATION_DATA") as? ReservationResponse

        if (reservation == null) {
            finish()
            return
        }

        populateSummary(reservation!!)

        binding.btnViewQR.setOnClickListener {
            val intent = Intent(this, QRDisplayActivity::class.java).apply {
                putExtra("RESERVATION_DATA", reservation)
            }
            startActivity(intent)
        }

        binding.btnBackToDashboard.setOnClickListener {
            val intent = Intent(this, ProsumerDashboardActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
            finish()
        }
    }

    private fun populateSummary(res: ReservationResponse) {
        binding.tvReservationNumber.text = if (res.reservationNumber.isNotBlank()) {
            res.reservationNumber
        } else {
            "#RES-${res.id.takeLast(6).uppercase()}"
        }

        binding.tvStationName.text = if (res.stationName.isNotBlank()) res.stationName else "Hub: ${res.stationId}"

        val datePart = res.reservationDate.split("T").firstOrNull() ?: res.reservationDate
        val startPart = res.startTime.split("T").lastOrNull()?.take(5) ?: res.startTime
        val endPart = res.endTime.split("T").lastOrNull()?.take(5) ?: res.endTime
        binding.tvSlotTiming.text = "$datePart | $startPart - $endPart"

        binding.tvEnergyVolume.text = String.format("%.1f kW", res.energyAmountKW)
        binding.tvTradeType.text = res.tradeType

        binding.tvStatusBadge.text = res.status

        when (res.status.lowercase()) {
            "approved" -> {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_approved)
                binding.tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_approved))
                binding.ivStatusIcon.setImageResource(android.R.drawable.checkbox_on_background)
                binding.ivStatusIcon.setColorFilter(ContextCompat.getColor(this, R.color.status_approved))
                binding.btnViewQR.visibility = View.VISIBLE
            }
            "pending" -> {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_pending)
                binding.tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_pending))
                binding.ivStatusIcon.setImageResource(android.R.drawable.ic_dialog_info)
                binding.ivStatusIcon.setColorFilter(ContextCompat.getColor(this, R.color.status_pending))
                binding.btnViewQR.visibility = View.GONE
            }
            "cancelled" -> {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_cancelled)
                binding.tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_cancelled))
                binding.ivStatusIcon.setImageResource(android.R.drawable.ic_delete)
                binding.ivStatusIcon.setColorFilter(ContextCompat.getColor(this, R.color.status_cancelled))
                binding.tvSummaryTitle.text = "Booking Cancelled"
                binding.btnViewQR.visibility = View.GONE
            }
            else -> {
                binding.tvStatusBadge.setBackgroundResource(R.drawable.bg_badge_completed)
                binding.tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_completed))
                binding.btnViewQR.visibility = View.GONE
            }
        }
    }
}
