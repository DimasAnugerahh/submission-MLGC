const predictClassification = require("../services/inferenceService");
const crypto = require("crypto");
const storeData = require("../services/storeData");

async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;

  let confidenceScore, label, suggestion;

  try {
    const result = await predictClassification(model, image);
    confidenceScore = result.confidenceScore;
    label = result.label;
    suggestion = result.suggestion;
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: "Terjadi kesalahan dalam melakukan prediksi",
      })
      .code(400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const data = {
    id,
    result: label,
    suggestion,
    createdAt,
  };

  try {
    await storeData(id, data);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: `Terjadi kesalahan saat menyimpan hasil prediksi ke database. ${{ error }}`,
      })
      .code(500);
  }

  const message = "Model is predicted successfully";

  const response = h.response({
    status: "success",
    message: message,
    data: {
      id,
      result: label,
      suggestion: suggestion,
      createdAt,
    },
  });

  response.code(201);
  return response;
}

const { Firestore } = require("@google-cloud/firestore");
const db = new Firestore();

const predictCollection = db.collection("predictions");

async function getHistoriesHandler(request, h) {
  try {
    const predictSnapshot = await predictCollection.get();

    if (predictSnapshot.empty) {
      return h
        .response({
          status: "fail",
          message: "No predictions found",
        })
        .code(404);
    }

    const predictionsData = [];

    predictSnapshot.forEach((doc) => {
      const docData = doc.data();
      predictionsData.push({
        id: doc.id,
        history: {
          result: docData.result,
          createdAt: docData.createdAt,
          suggestion: docData.suggestion,
          id: doc.id,
        },
      });
    });

    return h
      .response({
        status: "success",
        data: predictionsData,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: `An error occurred while fetching predictions: ${error.message}`,
      })
      .code(500);
  }
}

module.exports = { postPredictHandler, getHistoriesHandler };
