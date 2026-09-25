package com.solarix.mobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.repository.AuthRepository
import com.solarix.mobile.data.repository.ReservationRepository
import com.solarix.mobile.databinding.ActivityProsumerDashboardBinding
import com.solarix.mobile.ui.auth.LoginActivity
import com.solarix.mobile.ui.map.StationsMapActivity
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class ProsumerDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProsumerDashboardBinding
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProsumerDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager.getInstance(this)
        reservationRepository = ReservationRepository(this)
        authRepository = AuthRepository(this)

        setupUserHeader()
        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        loadDashboardMetrics()
    }

    private fun setupUserHeader() {
        val fullName = sessionManager.getUserFullName() ?: "Prosumer"
        val nic = sessionManager.getUserNic() ?: "Unknown"

        binding.tvWelcomeName.text = "Hello, $fullName"
        binding.tvUserNic.text = "NIC: $nic"
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            loadDashboardMetrics()
        }

        binding.cardActionBookSlot.setOnClickListener {
            startActivity(Intent(this, CreateBookingActivity::class.java))
        }

        binding.cardActionHistory.setOnClickListener {
            startActivity(Intent(this, BookingHistoryActivity::class.java))
        }

        binding.cardActionMap.setOnClickListener {
            startActivity(Intent(this, StationsMapActivity::class.java))
        }

        binding.cardActionProfile.setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }

        binding.btnLogout.setOnClickListener {
            showLogoutConfirmation()
        }

        binding.cardPending.setOnClickListener {
            val intent = Intent(this, BookingHistoryActivity::class.java).apply {
                putExtra("FILTER_STATUS", "Pending")
            }
            startActivity(intent)
        }

        binding.cardApproved.setOnClickListener {
            val intent = Intent(this, BookingHistoryActivity::class.java).apply {
                putExtra("FILTER_STATUS", "Approved")
            }
            startActivity(intent)
        }
    }

    private fun loadDashboardMetrics() {
        val nic = sessionManager.getUserNic() ?: return
        binding.swipeRefresh.isRefreshing = true

        lifecycleScope.launch {
            val result = reservationRepository.getReservationsByProsumer(nic)
            binding.swipeRefresh.isRefreshing = false

            result.onSuccess { reservations ->
                val pendingCount = reservations.count { it.status.equals("Pending", ignoreCase = true) }
                val approvedCount = reservations.count { it.status.equals("Approved", ignoreCase = true) }

                binding.tvPendingCount.text = pendingCount.toString()
                binding.tvApprovedCount.text = approvedCount.toString()
            }.onFailure { error ->
                Toast.makeText(this@ProsumerDashboardActivity, "Offline mode: Showing cached data", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showLogoutConfirmation() {
        AlertDialog.Builder(this)
            .setTitle("Confirm Logout")
            .setMessage("Are you sure you want to end your SolariX session?")
            .setPositiveButton("Logout") { _, _ ->
                lifecycleScope.launch {
                    authRepository.logout()
                    val intent = Intent(this@ProsumerDashboardActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
