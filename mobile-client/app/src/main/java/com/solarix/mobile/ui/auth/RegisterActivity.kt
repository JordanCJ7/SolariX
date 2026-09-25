package com.solarix.mobile.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.dtos.RegisterProsumerRequest
import com.solarix.mobile.data.repository.AuthRepository
import com.solarix.mobile.databinding.ActivityRegisterBinding
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(this)

        binding.btnRegister.setOnClickListener {
            val nic = binding.etNic.text.toString().trim()
            val fullName = binding.etFullName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val phone = binding.etPhone.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            val address = binding.etAddress.text.toString().trim()
            val capacityStr = binding.etCapacity.text.toString().trim()
            val capacity = capacityStr.toDoubleOrNull() ?: 5.0

            if (nic.isBlank() || fullName.isBlank() || email.isBlank() || phone.isBlank() || password.isBlank()) {
                Toast.makeText(this, "Please fill in all required fields.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performRegistration(
                RegisterProsumerRequest(
                    nic = nic,
                    fullName = fullName,
                    email = email,
                    phoneNumber = phone,
                    password = password,
                    address = address,
                    solarCapacityKW = capacity
                )
            )
        }

        binding.tvBackToLogin.setOnClickListener {
            finish()
        }
    }

    private fun performRegistration(request: RegisterProsumerRequest) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnRegister.isEnabled = false

        lifecycleScope.launch {
            val result = authRepository.registerProsumer(request)
            binding.progressBar.visibility = View.GONE
            binding.btnRegister.isEnabled = true

            result.onSuccess { user ->
                AlertDialog.Builder(this@RegisterActivity)
                    .setTitle("Registration Submitted")
                    .setMessage("Your prosumer account with NIC '${user.nic}' has been created with status '${user.status}'. You may now log in.")
                    .setPositiveButton("Sign In") { _, _ ->
                        finish()
                    }
                    .setCancelable(false)
                    .show()
            }.onFailure { error ->
                AlertDialog.Builder(this@RegisterActivity)
                    .setTitle("Registration Failed")
                    .setMessage(error.message ?: "Could not complete registration. Ensure the NIC and Email are unique.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }
}
