package com.solarix.mobile.ui.operator

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.repository.AuthRepository
import com.solarix.mobile.databinding.ActivityOperatorDashboardBinding
import com.solarix.mobile.ui.auth.LoginActivity
import com.solarix.mobile.ui.map.StationsMapActivity
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class OperatorDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOperatorDashboardBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOperatorDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager.getInstance(this)
        authRepository = AuthRepository(this)

        setupUI()
        setupListeners()
    }

    private fun setupUI() {
        val fullName = sessionManager.getUserFullName() ?: "Grid Operator"
        val nic = sessionManager.getUserNic() ?: "Unknown"

        binding.tvOperatorName.text = fullName
        binding.tvOperatorNic.text = "Operator ID: $nic"
    }

    private fun setupListeners() {
        binding.cardScanQR.setOnClickListener {
            startActivity(Intent(this, QRScannerActivity::class.java))
        }

        binding.cardOperatorMap.setOnClickListener {
            startActivity(Intent(this, StationsMapActivity::class.java))
        }

        binding.btnOperatorLogout.setOnClickListener {
            showLogoutConfirmation()
        }
    }

    private fun showLogoutConfirmation() {
        AlertDialog.Builder(this)
            .setTitle("Confirm Logout")
            .setMessage("Do you want to log out of the Grid Operator console?")
            .setPositiveButton("Logout") { _, _ ->
                lifecycleScope.launch {
                    authRepository.logout()
                    val intent = Intent(this@OperatorDashboardActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
