const { Appointment, mongoose } = require('../db');

async function getAppointmentSummary() {
  const [summary = { byStatus: [], byType: [] }] = await Appointment.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        byType: [
          { $group: { _id: '$appointment_type', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);
  return summary;
}

async function getAppointmentQueueView() {
  const records = await mongoose.connection.db.collection('appointment_queue_view')
    .find()
    .sort({ appointment_date: -1, priority: 1, arrival_time: 1 })
    .limit(25)
    .toArray();
  return records.map(({ _id, ...record }) => ({ id: _id.toString(), ...record }));
}

module.exports = { getAppointmentSummary, getAppointmentQueueView };
