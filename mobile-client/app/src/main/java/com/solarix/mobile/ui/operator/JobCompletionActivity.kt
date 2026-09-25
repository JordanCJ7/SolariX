package com.solarix.mobile.ui.operator

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.dtos.VerifyAndCompleteRequest
import com.solarix.mobile.data.repository.ReservationRepository
import com.solarix.mobile.databinding.ActivityJobCompletionBinding
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class JobCompletionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityJobCompletionBinding
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var sessionManager: SessionManager
    private var qrToken: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityJobCompletionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        reservationRepository = ReservationRepository(this)
        sessionManager = SessionManager.getInstance(this)

        qrToken = intent.getStringExtra("SCANNED_QR_TOKEN") ?: ""
        if (qrToken.isBlank()) {
            Toast.makeText(this, "No QR token received.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupUI()
        setupListeners()
    }

    private fun setupUI() {
        val operatorNic = sessionManager.getUserNic() ?: "OPERATOR"
        binding.tvScannedToken.text = qrToken
        binding.etOperatorNic.setText(operatorNic)
    }

    private fun setupListeners() {
        binding.btnFinalizeTransfer.setOnClickListener {
            finalizeTransaction()
        }
    }

    private fun finalizeTransaction() {
        val operatorNic = sessionManager.getUserNic()
        if (operatorNic.isNullOrBlank()) {
            Toast.makeText(this, "Operator session invalid.", Toast.LENGTH_SHORT).show()
            return
        }

        val energyStr = binding.etDeliveredEnergy.text.toString().trim()
        val energy = energyStr.toDoubleOrNull()
        if (energy == null || energy <= 0) {
            Toast.makeText(this, "Please enter a valid delivered energy volume.", Toast.LENGTH_SHORT).show()
            return
        }

        val notes = binding.etOperatorNotes.text.toString().trim()

        val request = VerifyAndCompleteRequest(
            qrToken = qrToken,
            operatorId = operatorNic,
            energyDeliveredKWh = energy,
            notes = notes.ifBlank { null }
        )

        binding.progressBar.visibility = View.VISIBLE
        binding.btnFinalizeTransfer.isEnabled = false

        lifecycleScope.launch {
            val result = reservationRepository.verifyAndComplete(request)
            binding.progressBar.visibility = View.GONE
            binding.btnFinalizeTransfer.isEnabled = true

            result.onSuccess { reservation ->
                AlertDialog.Builder(this@JobCompletionActivity)
                    .setTitle("Energy Transfer Completed")
                    .setMessage(
                        "Reservation #${reservation.reservationNumber} successfully verified!\n\n" +
                                "Delivered Energy: $energy kWh\n" +
                                "Status: ${reservation.status}\n" +
                                "Prosumer: ${reservation.prosumerNIC}\n" +
                                "Station: ${reservation.stationName}"
                    )
                    .setPositiveButton("Done") { _, _ ->
                        finish()
                    }
                    .setCancelable(false)
                    .show()
            }.onFailure { error ->
                // Displays server error message (e.g. invalid HMAC signature or reservation not Approved)
                AlertDialog.Builder(this@JobCompletionActivity)
                    .setTitle("Transaction Verification Failed")
                    .setMessage(error.message ?: "Failed to verify QR token or complete reservation.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
