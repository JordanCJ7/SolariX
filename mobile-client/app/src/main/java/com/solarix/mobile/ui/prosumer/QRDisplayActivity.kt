package com.solarix.mobile.ui.prosumer

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.solarix.mobile.data.remote.dtos.ReservationResponse
import com.solarix.mobile.databinding.ActivityQrDisplayBinding
import com.solarix.mobile.utils.QRCodeGenerator

class QRDisplayActivity : AppCompatActivity() {

    private lateinit var binding: ActivityQrDisplayBinding
    private var reservation: ReservationResponse? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrDisplayBinding.inflate(layoutInflater)
        setContentView(binding.root)

        @Suppress("DEPRECATION")
        reservation = intent.getSerializableExtra("RESERVATION_DATA") as? ReservationResponse

        if (reservation == null) {
            Toast.makeText(this, "No booking information found.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        renderDetails(reservation!!)
        renderQRCode(reservation!!)

        binding.btnClose.setOnClickListener {
            finish()
        }
    }

    private fun renderDetails(res: ReservationResponse) {
        val refNumber = if (res.reservationNumber.isNotBlank()) res.reservationNumber else "#RES-${res.id.takeLast(6).uppercase()}"
        binding.tvBookingRef.text = refNumber

        val stName = if (res.stationName.isNotBlank()) res.stationName else "Station: ${res.stationId}"
        binding.tvQrStation.text = "Hub: $stName"

        val datePart = res.reservationDate.split("T").firstOrNull() ?: res.reservationDate
        val startPart = res.startTime.split("T").lastOrNull()?.take(5) ?: res.startTime
        val endPart = res.endTime.split("T").lastOrNull()?.take(5) ?: res.endTime
        binding.tvQrSlot.text = "Slot: $datePart | $startPart - $endPart"

        binding.tvQrEnergy.text = "Trade: ${String.format("%.1f", res.energyAmountKW)} kW (${res.tradeType})"
    }

    private fun renderQRCode(res: ReservationResponse) {
        val token = res.qrCodeToken
        if (token.isBlank()) {
            Toast.makeText(this, "QR Code Token not generated yet for this booking.", Toast.LENGTH_LONG).show()
            return
        }

        // Generate sharp QR bitmap using native ZXing writer
        val bitmap = QRCodeGenerator.generateQRCodeBitmap(token, 600, 600)
        if (bitmap != null) {
            binding.ivQRCode.setImageBitmap(bitmap)
        } else {
            Toast.makeText(this, "Could not render QR code bitmap.", Toast.LENGTH_SHORT).show()
        }
    }
}
