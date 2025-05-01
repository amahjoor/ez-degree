package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.TimeFoldCustom;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import java.io.IOException;

public class CustomTimefoldRatingCountDeserializer extends StdDeserializer<Integer> {

    public CustomTimefoldRatingCountDeserializer() {
        this(null);
    }

    public CustomTimefoldRatingCountDeserializer(Class<?> vc) {
        super(vc);
    }

    @Override
    public Integer deserialize(JsonParser jp, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {
        String ratingCountText = jp.getText();
        String[] parts = ratingCountText.split(" ");
        try {
            return Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
