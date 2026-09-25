package com.solarix.mobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.dtos.UpdateProfileRequest
import com.solarix.mobile.data.repository.AuthRepository
import com.solarix.mobile.databinding.ActivityProsumerProfileBinding
import com.solarix.mobile.ui.auth.LoginActivity
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class ProsumerProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProsumerProfileBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProsumerProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(this)
        sessionManager = SessionManager.getInstance(this)

        loadProfile()
        setupListeners()
    }

    private fun loadProfile() {
        val nic = sessionManager.getUserNic() ?: return
        binding.progressBar.visibility = View.VISIBLE

        binding.etProfileNic.setText(nic)
        binding.etProfileEmail.setText(sessionManager.getUserEmail() ?: "")
        binding.etProfileFullName.setText(sessionManager.getUserFullName() ?: "")

        lifecycleScope.launch {
            val result = authRepository.getProfile(nic)
            binding.progressBar.visibility = View.GONE

            result.onSuccess { user ->
                binding.etProfileFullName.setText(user.fullName)
                binding.etProfileEmail.setText(user.email)
                binding.etProfilePhone.setText(user.phoneNumber)
                binding.etProfileAddress.setText(user.address)
                binding.etProfileCapacity.setText(user.solarCapacityKW.toString())
            }.onFailure {
                // If offline, default values from session are already displayed
            }
        }
    }

    private fun setupListeners() {
        binding.btnSaveProfile.setOnClickListener {
            saveProfileChanges()
        }

        binding.btnDeactivateAccount.setOnClickListener {
            showDeactivateConfirmation()
        }
    }

    private fun saveProfileChanges() {
        val nic = sessionManager.getUserNic() ?: return
        val fullName = binding.etProfileFullName.text.toString().trim()
        val phone = binding.etProfilePhone.text.toString().trim()
        val address = binding.etProfileAddress.text.toString().trim()
        val capacityStr = binding.etProfileCapacity.text.toString().trim()
        val capacity = capacityStr.toDoubleOrNull() ?: 5.0

        if (fullName.isBlank()) {
            Toast.makeText(this, "Full name cannot be empty.", Toast.LENGTH_SHORT).show()
            return
        }

        val request = UpdateProfileRequest(
            fullName = fullName,
            phoneNumber = phone,
            address = address,
            solarCapacityKW = capacity
        )

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSaveProfile.isEnabled = false

        lifecycleScope.launch {
            val result = authRepository.updateProfile(nic, request)
            binding.progressBar.visibility = View.GONE
            binding.btnSaveProfile.isEnabled = true

            result.onSuccess { updated ->
                Toast.makeText(this@ProsumerProfileActivity, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
            }.onFailure { error ->
                AlertDialog.Builder(this@ProsumerProfileActivity)
                    .setTitle("Update Failed")
                    .setMessage(error.message ?: "Failed to update profile.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    private fun showDeactivateConfirmation() {
        val nic = sessionManager.getUserNic() ?: return

        AlertDialog.Builder(this)
            .setTitle("Confirm Deactivation Request")
            .setMessage("Are you sure you want to deactivate your prosumer account? You will be immediately logged out. Reactivation requires Backoffice administrative review.")
            .setPositiveButton("Yes, Deactivate") { _, _ ->
                executeDeactivation(nic)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun executeDeactivation(nic: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnDeactivateAccount.isEnabled = false

        lifecycleScope.launch {
            val result = authRepository.deactivateAccount(nic)
            binding.progressBar.visibility = View.GONE

            result.onSuccess { msg ->
                AlertDialog.Builder(this@ProsumerProfileActivity)
                    .setTitle("Account Deactivated")
                    .setMessage(msg)
                    .setPositiveButton("OK") { _, _ ->
                        val intent = Intent(this@ProsumerProfileActivity, LoginActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                    .setCancelable(false)
                    .show()
            }.onFailure { error ->
                binding.btnDeactivateAccount.isEnabled = true
                AlertDialog.Builder(this@ProsumerProfileActivity)
                    .setTitle("Deactivation Failed")
                    .setMessage(error.message ?: "Could not complete account deactivation.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
