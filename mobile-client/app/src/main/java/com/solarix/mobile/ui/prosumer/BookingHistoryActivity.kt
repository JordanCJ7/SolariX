package com.solarix.mobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.solarix.mobile.data.remote.dtos.ReservationResponse
import com.solarix.mobile.data.repository.ReservationRepository
import com.solarix.mobile.databinding.ActivityBookingHistoryBinding
import com.solarix.mobile.ui.prosumer.adapters.BookingsAdapter
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class BookingHistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBookingHistoryBinding
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: BookingsAdapter

    private var allReservations: List<ReservationResponse> = emptyList()
    private var currentFilterStatus: String = "All"
    private var currentSearchQuery: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBookingHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        reservationRepository = ReservationRepository(this)
        sessionManager = SessionManager.getInstance(this)

        setupRecyclerView()
        setupFilters()
        setupListeners()

        // Check if an initial status filter was passed
        val initialStatus = intent.getStringExtra("FILTER_STATUS")
        if (!initialStatus.isNullOrBlank()) {
            currentFilterStatus = initialStatus
            selectChipForStatus(initialStatus)
        }
    }

    override fun onResume() {
        super.onResume()
        loadBookings()
    }

    private fun setupRecyclerView() {
        adapter = BookingsAdapter(
            bookings = emptyList(),
            onViewQRClick = { item ->
                val intent = Intent(this, QRDisplayActivity::class.java).apply {
                    putExtra("RESERVATION_DATA", item)
                }
                startActivity(intent)
            },
            onEditClick = { item ->
                val intent = Intent(this, EditBookingActivity::class.java).apply {
                    putExtra("RESERVATION_DATA", item)
                }
                startActivity(intent)
            }
        )
        binding.rvBookings.layoutManager = LinearLayoutManager(this)
        binding.rvBookings.adapter = adapter
    }

    private fun setupFilters() {
        binding.chipGroupStatus.setOnCheckedStateChangeListener { _, checkedIds ->
            val checkedId = checkedIds.firstOrNull() ?: View.NO_ID
            currentFilterStatus = when (checkedId) {
                binding.chipApproved.id -> "Approved"
                binding.chipPending.id -> "Pending"
                binding.chipCompleted.id -> "Completed"
                binding.chipCancelled.id -> "Cancelled"
                else -> "All"
            }
            applyFilters()
        }

        binding.etSearchQuery.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                currentSearchQuery = s?.toString()?.trim() ?: ""
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun selectChipForStatus(status: String) {
        when (status.lowercase()) {
            "approved" -> binding.chipApproved.isChecked = true
            "pending" -> binding.chipPending.isChecked = true
            "completed" -> binding.chipCompleted.isChecked = true
            "cancelled" -> binding.chipCancelled.isChecked = true
            else -> binding.chipAll.isChecked = true
        }
    }

    private fun setupListeners() {
        binding.swipeRefreshBookings.setOnRefreshListener {
            loadBookings()
        }
    }

    private fun loadBookings() {
        val nic = sessionManager.getUserNic() ?: return
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            val result = reservationRepository.getReservationsByProsumer(nic)
            binding.progressBar.visibility = View.GONE
            binding.swipeRefreshBookings.isRefreshing = false

            result.onSuccess { reservations ->
                allReservations = reservations
                applyFilters()
            }.onFailure { error ->
                Toast.makeText(this@BookingHistoryActivity, "Error loading bookings: ${error.message}", Toast.LENGTH_SHORT).show()
                applyFilters()
            }
        }
    }

    private fun applyFilters() {
        var filtered = allReservations

        // Status Filter
        if (!currentFilterStatus.equals("All", ignoreCase = true)) {
            filtered = filtered.filter { it.status.equals(currentFilterStatus, ignoreCase = true) }
        }

        // Search Query (by station name or reservation number)
        if (currentSearchQuery.isNotBlank()) {
            val q = currentSearchQuery.lowercase()
            filtered = filtered.filter {
                it.stationName.lowercase().contains(q) ||
                it.reservationNumber.lowercase().contains(q) ||
                it.stationId.lowercase().contains(q)
            }
        }

        adapter.updateData(filtered)

        if (filtered.isEmpty()) {
            binding.tvEmptyState.visibility = View.VISIBLE
        } else {
            binding.tvEmptyState.visibility = View.GONE
        }
    }
}
