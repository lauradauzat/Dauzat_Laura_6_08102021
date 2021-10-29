const jwt = require('jsonwebtoken');
const Sauce = require('../models/Sauce');
const fs = require('fs');
const { setUncaughtExceptionCaptureCallback } = require('process');


//GET Renvoie un tableau de toutes les sauces de la base de données.

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

//GET Renvoie la sauce avec l’_id fourni.

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};


//POST  Capture et enregistre l'image, analyse la sauce transformée en chaîne decaractères et l'enregistredans la base de données en définissant correctement son imageUrl. 
//Initialise les likes et dislikes de la sauce à 0 et les usersLiked etusersDisliked avec destableaux vides.
// Remarquez que le corps de la demandeinitiale est vide ; lorsque multer est ajouté, il renvoie une chaîne pour le corps de la demande en fonction des données soumises avec le fichier ???

exports.createSauce = (req, res, next) => {
  console.log(req.body.sauce);
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
     imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,

  });
 sauce.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

//Met à jour la sauce avec l'_id fourni. Si une image est téléchargée, elle est capturée et l’imageUrl de la sauce est mise à jour. 
//Si aucun fichier n'est fourni, les informations sur la sauce se trouvent directement dans le corps de la requête (req.body.name, req.body.heat, etc.). 
//Si un fichier est fourni, la sauce transformée en chaîne de caractères se trouve dans req.body.sauce. // Notez que le corps de la demande initiale est vide ; lorsque multer est ajouté, il renvoie une chaîne du corps de la demande basée sur les données soumises avec le fichier.

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};


//DELETE - Supprime la sauce avec l'ID fourni

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};


//POST _ LIKE LOGIC 
//Définit le statut « Like » pour l' userId fourni. Si like = 1, l'utilisateur aime (= like) la sauce. Si like = 0, l'utilisateur annule son like ou son dislike. Si like = -1, l'utilisateur n'aime pas (= dislike) la sauce. 
//L'ID de l'utilisateur doit être ajouté ou retiré du tableau approprié. Cela permet de garder une trace de leurs préférences et les empêche de liker ou de ne pas disliker la même sauce plusieurs fois : un utilisateur ne peut avoir qu'une seule valeur pour chaque sauce. 
//Le nombre total de « Like » et de « Dislike » est mis à jour à chaque nouvelle notation.

//Pour retourner un tableau sans un id donnée -> use filter

exports.likeStatus = (req, res, next) => {
  const sauceObject = { ...req.body };
  let like = req.body.like; 
  let userId = req.body.userId; 
  let sauce = req.params.id; 



  switch (like) {
    case 1 :
       //si like est a 1, ajouter un like et ajouter l'id de l'utilisateur dans l'array Userslike
        Sauce.updateOne({ _id: sauce }, { $inc: { likes: 1 }, $push: { usersLiked: userId } })
          .then(() => res.status(200).json({ message: `Like Added` }))
          .catch((error) => res.status(400).json({ error }))
            
      break;

    case 0 :
        Sauce.findOne({ _id: sauce })
           .then((sauce) => {
             //si l'utilisateur aiment la sauce (id présent dans usersLiked) retirer son id de l'array et retirer un like
            if (sauce.usersLiked.includes(userId)) { 
              Sauce.updateOne({ _id: sauce }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
                .then(() => res.status(200).json({ message: `Cancel Like` }))
                .catch((error) => res.status(400).json({ error }))
            }
            //si l'utilisateur avait disliké la sauce (id présent dans usersDisliked) retirer son id de l'array dislike et retirer un dislike
            if (sauce.usersDisliked.includes(userId)) { 
              Sauce.updateOne({ _id: sauce }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
                .then(() => res.status(200).json({ message: `Cancel Dislike` }))
                .catch((error) => res.status(400).json({ error }))
            }
          })
          .catch((error) => res.status(404).json({ error }))
      break;

    case -1 :
      //Si case is -1 , ajouter l'id de l'utilisateur a usersdislike, et ajouter un dislike
        Sauce.updateOne({ _id: sauce }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 }})
          .then(() => { res.status(200).json({ message: `Dislike Added` }) })
          .catch((error) => res.status(400).json({ error }))
      break;
      
      default:
        console.log('default');
  }



};

