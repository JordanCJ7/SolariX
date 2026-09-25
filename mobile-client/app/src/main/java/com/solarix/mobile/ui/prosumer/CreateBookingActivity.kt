package com.solarix.mobile.ui.prosumer

import android.app.DatePickerDialog
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.dtos.CreateReservationRequest
import com.solarix.mobile.data.remote.dtos.SlotResponse
import com.solarix.mobile.data.remote.dtos.StationResponse
import com.solarix.mobile.data.repository.ReservationRepository
import com.solarix.mobile.data.repository.StationRepository
import com.solarix.mobile.databinding.ActivityCreateBookingBinding
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class CreateBookingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCreateBookingBinding
    private lateinit var stationRepository: StationRepository
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var sessionManager: SessionManager

    private var stationsList: List<StationResponse> = emptyList()
    private var slotsList: List<SlotResponse> = emptyList()
    private var selectedStationId: String? = null
    private var selectedSlotId: String? = null
    private var selectedDateStr: String = ""

    private val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreateBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        stationRepository = StationRepository(this)
        reservationRepository = ReservationRepository(this)
        sessionManager = SessionManager.getInstance(this)

        // Default to today
        val calendar = Calendar.getInstance()
        selectedDateStr = dateFormatter.format(calendar.time)
        binding.etDate.setText(selectedDateStr)

        val preselectedStationId = intent.getStringExtra("STATION_ID")

        setupDatePicker()
        setupListeners()
        loadStations(preselectedStationId)
    }

    private fun setupDatePicker() {
        val calendar = Calendar.getInstance()
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, dayOfMonth ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
            selectedDateStr = dateFormatter.format(calendar.time)
            binding.etDate.setText(selectedDateStr)
            loadSlots()
        }

        binding.etDate.setOnClickListener {
            DatePickerDialog(
                this,
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
    }

    private fun setupListeners() {
        binding.spinnerStations.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position in stationsList.indices) {
                    selectedStationId = stationsList[position].id
                    loadSlots()
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {
                selectedStationId = null
            }
        }

        binding.spinnerSlots.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position in slotsList.indices) {
                    selectedSlotId = slotsList[position].id
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {
                selectedSlotId = null
            }
        }

        binding.btnSubmitBooking.setOnClickListener {
            submitBooking()
        }
    }

    private fun loadStations(preselectedId: String?) {
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            val result = stationRepository.getStations(activeOnly = true)
            binding.progressBar.visibility = View.GONE

            result.onSuccess { stations ->
                stationsList = stations
                val displayNames = stations.map { "${it.stationName} (${it.locationName})" }
                val adapter = ArrayAdapter(this@CreateBookingActivity, android.R.layout.simple_spinner_dropdown_item, displayNames)
                binding.spinnerStations.adapter = adapter

                if (!preselectedId.isNullOrBlank()) {
                    val index = stations.indexOfFirst { it.id == preselectedId }
                    if (index >= 0) {
                        binding.spinnerStations.setSelection(index)
                        selectedStationId = preselectedId
                    }
                } else if (stations.isNotEmpty()) {
                    selectedStationId = stations[0].id
                }

                loadSlots()
            }.onFailure { error ->
                Toast.makeText(this@CreateBookingActivity, "Error loading stations: ${error.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun loadSlots() {
        val stId = selectedStationId ?: return
        if (selectedDateStr.isBlank()) return

        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            val result = stationRepository.getSlotsForStation(stId, selectedDateStr)
            binding.progressBar.visibility = View.GONE

            result.onSuccess { slots ->
                slotsList = slots
                if (slots.isEmpty()) {
                    val emptyAdapter = ArrayAdapter(
                        this@CreateBookingActivity,
                        android.R.layout.simple_spinner_dropdown_item,
                        listOf("No slots generated for this date")
                    )
                    binding.spinnerSlots.adapter = emptyAdapter
                    selectedSlotId = null
                } else {
                    val displaySlots = slots.map {
                        val start = it.startTime.split("T").lastOrNull()?.take(5) ?: it.startTime
                        val end = it.endTime.split("T").lastOrNull()?.take(5) ?: it.endTime
                        "$start - $end (Avail: ${it.availableCapacityKW} kW)"
                    }
                    val adapter = ArrayAdapter(this@CreateBookingActivity, android.R.layout.simple_spinner_dropdown_item, displaySlots)
                    binding.spinnerSlots.adapter = adapter
                    selectedSlotId = slots[0].id
                }
            }.onFailure {
                val emptyAdapter = ArrayAdapter(
                    this@CreateBookingActivity,
                    android.R.layout.simple_spinner_dropdown_item,
                    listOf("Failed to load slots")
                )
                binding.spinnerSlots.adapter = emptyAdapter
                selectedSlotId = null
            }
        }
    }

    private fun submitBooking() {
        val nic = sessionManager.getUserNic()
        if (nic.isNullOrBlank()) {
            Toast.makeText(this, "Session invalid. Please login again.", Toast.LENGTH_SHORT).show()
            return
        }

        val stationId = selectedStationId
        if (stationId.isNullOrBlank()) {
            Toast.makeText(this, "Please select a solar station hub.", Toast.LENGTH_SHORT).show()
            return
        }

        val slotId = selectedSlotId
        if (slotId.isNullOrBlank()) {
            Toast.makeText(this, "Please select an available energy slot.", Toast.LENGTH_SHORT).show()
            return
        }

        val energyStr = binding.etEnergyAmount.text.toString().trim()
        val energy = energyStr.toDoubleOrNull()
        if (energy == null || energy <= 0) {
            Toast.makeText(this, "Please enter a valid energy volume.", Toast.LENGTH_SHORT).show()
            return
        }

        val tradeType = if (binding.rbDropOff.isChecked) "DropOff" else "Charge"

        val request = CreateReservationRequest(
            prosumerNIC = nic,
            stationId = stationId,
            slotId = slotId,
            energyAmountKW = energy,
            tradeType = tradeType
        )

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSubmitBooking.isEnabled = false

        lifecycleScope.launch {
            val result = reservationRepository.createReservation(request)
            binding.progressBar.visibility = View.GONE
            binding.btnSubmitBooking.isEnabled = true

            result.onSuccess { reservation ->
                Toast.makeText(this@CreateBookingActivity, "Reservation created successfully!", Toast.LENGTH_SHORT).show()
                val intent = Intent(this@CreateBookingActivity, BookingSummaryActivity::class.java).apply {
                    putExtra("RESERVATION_DATA", reservation)
                }
                startActivity(intent)
                finish()
            }.onFailure { error ->
                // Render exact server error message (e.g. 7-day validation or station deactivation guard)
                AlertDialog.Builder(this@CreateBookingActivity)
                    .setTitle("Booking Rejected by Server")
                    .setMessage(error.message ?: "The server rejected this reservation request.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
