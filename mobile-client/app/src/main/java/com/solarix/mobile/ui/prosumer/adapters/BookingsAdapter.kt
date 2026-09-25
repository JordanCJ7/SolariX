package com.solarix.mobile.ui.prosumer.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.solarix.mobile.R
import com.solarix.mobile.data.remote.dtos.ReservationResponse
import com.solarix.mobile.databinding.ItemBookingCardBinding

class BookingsAdapter(
    private var bookings: List<ReservationResponse>,
    private val onViewQRClick: (ReservationResponse) -> Unit,
    private val onEditClick: (ReservationResponse) -> Unit
) : RecyclerView.Adapter<BookingsAdapter.BookingViewHolder>() {

    fun updateData(newBookings: List<ReservationResponse>) {
        this.bookings = newBookings
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BookingViewHolder {
        val binding = ItemBookingCardBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return BookingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: BookingViewHolder, position: Int) {
        holder.bind(bookings[position])
    }

    override fun getItemCount(): Int = bookings.size

    inner class BookingViewHolder(private val binding: ItemBookingCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: ReservationResponse) {
            val context = binding.root.context

            binding.tvCardResNumber.text = if (item.reservationNumber.isNotBlank()) {
                item.reservationNumber
            } else {
                "#RES-${item.id.takeLast(6).uppercase()}"
            }

            binding.tvCardStationName.text = if (item.stationName.isNotBlank()) {
                item.stationName
            } else {
                "Solar Hub: ${item.stationId}"
            }

            val datePart = item.reservationDate.split("T").firstOrNull() ?: item.reservationDate
            val startPart = item.startTime.split("T").lastOrNull()?.take(5) ?: item.startTime
            val endPart = item.endTime.split("T").lastOrNull()?.take(5) ?: item.endTime
            binding.tvCardTiming.text = "$datePart | $startPart - $endPart"

            binding.tvCardEnergy.text = String.format("%.1f kW", item.energyAmountKW)
            binding.tvCardTradeType.text = item.tradeType

            // Status Styling
            binding.tvCardStatus.text = item.status
            when (item.status.lowercase()) {
                "approved" -> {
                    binding.tvCardStatus.setBackgroundResource(R.drawable.bg_badge_approved)
                    binding.tvCardStatus.setTextColor(ContextCompat.getColor(context, R.color.status_approved))
                    binding.btnCardQR.visibility = View.VISIBLE
                    binding.btnCardEdit.visibility = View.VISIBLE
                }
                "pending" -> {
                    binding.tvCardStatus.setBackgroundResource(R.drawable.bg_badge_pending)
                    binding.tvCardStatus.setTextColor(ContextCompat.getColor(context, R.color.status_pending))
                    binding.btnCardQR.visibility = View.GONE
                    binding.btnCardEdit.visibility = View.VISIBLE
                }
                "completed" -> {
                    binding.tvCardStatus.setBackgroundResource(R.drawable.bg_badge_completed)
                    binding.tvCardStatus.setTextColor(ContextCompat.getColor(context, R.color.status_completed))
                    binding.btnCardQR.visibility = View.GONE
                    binding.btnCardEdit.visibility = View.GONE
                }
                "cancelled" -> {
                    binding.tvCardStatus.setBackgroundResource(R.drawable.bg_badge_cancelled)
                    binding.tvCardStatus.setTextColor(ContextCompat.getColor(context, R.color.status_cancelled))
                    binding.btnCardQR.visibility = View.GONE
                    binding.btnCardEdit.visibility = View.GONE
                }
                else -> {
                    binding.tvCardStatus.setBackgroundResource(R.drawable.bg_badge_pending)
                    binding.tvCardStatus.setTextColor(ContextCompat.getColor(context, R.color.status_pending))
                    binding.btnCardQR.visibility = View.GONE
                    binding.btnCardEdit.visibility = View.VISIBLE
                }
            }

            binding.btnCardQR.setOnClickListener { onViewQRClick(item) }
            binding.btnCardEdit.setOnClickListener { onEditClick(item) }
        }
    }
}
