package com.solarix.mobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.dtos.CancelReservationRequest
import com.solarix.mobile.data.remote.dtos.ReservationResponse
import com.solarix.mobile.data.remote.dtos.SlotResponse
import com.solarix.mobile.data.remote.dtos.UpdateReservationRequest
import com.solarix.mobile.data.repository.ReservationRepository
import com.solarix.mobile.data.repository.StationRepository
import com.solarix.mobile.databinding.ActivityEditBookingBinding
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class EditBookingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEditBookingBinding
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var stationRepository: StationRepository
    private lateinit var sessionManager: SessionManager

    private var currentReservation: ReservationResponse? = null
    private var slotsList: List<SlotResponse> = emptyList()
    private var selectedSlotId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        reservationRepository = ReservationRepository(this)
        stationRepository = StationRepository(this)
        sessionManager = SessionManager.getInstance(this)

        @Suppress("DEPRECATION")
        currentReservation = intent.getSerializableExtra("RESERVATION_DATA") as? ReservationResponse

        if (currentReservation == null) {
            val resId = intent.getStringExtra("RESERVATION_ID")
            if (!resId.isNullOrBlank()) {
                loadReservationById(resId)
            } else {
                Toast.makeText(this, "No reservation data provided.", Toast.LENGTH_SHORT).show()
                finish()
            }
        } else {
            populateUI(currentReservation!!)
        }

        setupListeners()
    }

    private fun loadReservationById(id: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            val result = reservationRepository.getReservationById(id)
            binding.progressBar.visibility = View.GONE
            result.onSuccess {
                currentReservation = it
                populateUI(it)
            }.onFailure {
                Toast.makeText(this@EditBookingActivity, "Could not load booking: ${it.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun populateUI(res: ReservationResponse) {
        binding.tvBookingReference.text = "Reservation: ${res.reservationNumber.ifBlank { "#RES-${res.id.takeLast(6).uppercase()}" }}"
        binding.tvStationInfo.text = "Station: ${res.stationName.ifBlank { res.stationId }}"
        binding.etEditEnergy.setText(res.energyAmountKW.toString())

        if (res.tradeType.equals("Charge", ignoreCase = true)) {
            binding.rbEditCharge.isChecked = true
        } else {
            binding.rbEditDropOff.isChecked = true
        }

        loadSlotsForStation(res.stationId, res.reservationDate.split("T").firstOrNull())
    }

    private fun loadSlotsForStation(stationId: String, date: String?) {
        lifecycleScope.launch {
            val result = stationRepository.getSlotsForStation(stationId, date)
            result.onSuccess { slots ->
                slotsList = slots
                val displaySlots = mutableListOf("Keep Current Slot")
                displaySlots.addAll(slots.map {
                    val start = it.startTime.split("T").lastOrNull()?.take(5) ?: it.startTime
                    val end = it.endTime.split("T").lastOrNull()?.take(5) ?: it.endTime
                    "$start - $end (Avail: ${it.availableCapacityKW} kW)"
                })

                val adapter = ArrayAdapter(this@EditBookingActivity, android.R.layout.simple_spinner_dropdown_item, displaySlots)
                binding.spinnerEditSlots.adapter = adapter
            }
        }
    }

    private fun setupListeners() {
        binding.btnSaveUpdate.setOnClickListener {
            performUpdate()
        }

        binding.btnCancelReservation.setOnClickListener {
            showCancelConfirmation()
        }
    }

    private fun performUpdate() {
        val res = currentReservation ?: return
        val nic = sessionManager.getUserNic() ?: return

        val energyStr = binding.etEditEnergy.text.toString().trim()
        val energy = energyStr.toDoubleOrNull()
        if (energy == null || energy <= 0) {
            Toast.makeText(this, "Please enter a valid energy amount.", Toast.LENGTH_SHORT).show()
            return
        }

        val slotPosition = binding.spinnerEditSlots.selectedItemPosition
        val newSlotId = if (slotPosition > 0 && (slotPosition - 1) in slotsList.indices) {
            slotsList[slotPosition - 1].id
        } else null

        val tradeType = if (binding.rbEditDropOff.isChecked) "DropOff" else "Charge"

        val request = UpdateReservationRequest(
            newSlotId = newSlotId,
            newEnergyAmountKW = energy,
            tradeType = tradeType
        )

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSaveUpdate.isEnabled = false

        lifecycleScope.launch {
            val result = reservationRepository.updateReservation(res.id, nic, request)
            binding.progressBar.visibility = View.GONE
            binding.btnSaveUpdate.isEnabled = true

            result.onSuccess { updated ->
                Toast.makeText(this@EditBookingActivity, "Booking updated successfully!", Toast.LENGTH_SHORT).show()
                val intent = Intent(this@EditBookingActivity, BookingSummaryActivity::class.java).apply {
                    putExtra("RESERVATION_DATA", updated)
                }
                startActivity(intent)
                finish()
            }.onFailure { error ->
                // Displays server error message (e.g. 12-hour threshold violation) in alert dialog without crashing
                AlertDialog.Builder(this@EditBookingActivity)
                    .setTitle("Update Denied by Server")
                    .setMessage(error.message ?: "The server rejected this update. Modifications require at least 12 hours notice prior to the slot.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    private fun showCancelConfirmation() {
        val res = currentReservation ?: return
        val nic = sessionManager.getUserNic() ?: return

        AlertDialog.Builder(this)
            .setTitle("Confirm Cancellation")
            .setMessage("Are you sure you want to cancel this booking? Reservations cannot be cancelled within 12 hours of the slot start time.")
            .setPositiveButton("Yes, Cancel") { _, _ ->
                executeCancellation(res.id, nic)
            }
            .setNegativeButton("No", null)
            .show()
    }

    private fun executeCancellation(resId: String, nic: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnCancelReservation.isEnabled = false

        lifecycleScope.launch {
            val result = reservationRepository.cancelReservation(
                resId,
                CancelReservationRequest(prosumerNIC = nic, reason = "Cancelled via Mobile Client")
            )
            binding.progressBar.visibility = View.GONE
            binding.btnCancelReservation.isEnabled = true

            result.onSuccess { cancelled ->
                Toast.makeText(this@EditBookingActivity, "Booking cancelled successfully.", Toast.LENGTH_SHORT).show()
                val intent = Intent(this@EditBookingActivity, BookingSummaryActivity::class.java).apply {
                    putExtra("RESERVATION_DATA", cancelled)
                }
                startActivity(intent)
                finish()
            }.onFailure { error ->
                // Render exact server-side cancellation denial
                AlertDialog.Builder(this@EditBookingActivity)
                    .setTitle("Cancellation Denied")
                    .setMessage(error.message ?: "The server rejected cancellation because the 12-hour minimum notice threshold has elapsed.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
